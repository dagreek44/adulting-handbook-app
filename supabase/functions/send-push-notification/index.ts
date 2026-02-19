import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushNotificationRequest {
  user_ids: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

function base64URLEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");
  
  const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: expiry,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
  };

  const encodedHeader = base64URLEncode(JSON.stringify(header));
  const encodedPayload = base64URLEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const privateKey = await importPrivateKey(serviceAccount.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    stringToArrayBuffer(unsignedToken)
  );

  const encodedSignature = base64URLEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );
  const jwt = `${unsignedToken}.${encodedSignature}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

interface FCMResult {
  success: boolean;
  errorBody?: string;
}

async function sendFCMNotification(
  accessToken: string,
  projectId: string,
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<FCMResult> {
  const message = {
    message: {
      token: fcmToken,
      notification: { title, body },
      data: data || {},
      android: {
        priority: "high",
        notification: {
          channel_id: "default",
          sound: "default",
          click_action: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      apns: {
        payload: {
          aps: { sound: "default", badge: 1 },
        },
      },
    },
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`FCM send error for token ${fcmToken.substring(0, 20)}...:`, errorBody);
    return { success: false, errorBody };
  }

  return { success: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT not configured");
    }

    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);
    const { user_ids, title, body, data }: PushNotificationRequest = await req.json();

    if (!user_ids || !user_ids.length || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_ids, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: deviceTokens, error: tokensError } = await supabase
      .from("device_tokens")
      .select("fcm_token, user_id")
      .in("user_id", user_ids);

    if (tokensError) {
      throw new Error(`Failed to fetch device tokens: ${tokensError.message}`);
    }

    if (!deviceTokens || deviceTokens.length === 0) {
      console.log("No device tokens found for users:", user_ids);
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No device tokens found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getAccessToken(serviceAccount);

    let successCount = 0;
    let failCount = 0;
    let cleanedCount = 0;

    for (const { fcm_token } of deviceTokens) {
      const result = await sendFCMNotification(
        accessToken,
        serviceAccount.project_id,
        fcm_token,
        title,
        body,
        data
      );

      if (result.success) {
        successCount++;
      } else {
        failCount++;

        // Clean up stale/unregistered tokens
        if (result.errorBody && (
          result.errorBody.includes("UNREGISTERED") ||
          result.errorBody.includes("NOT_FOUND")
        )) {
          console.log(`Cleaning up stale token: ${fcm_token.substring(0, 20)}...`);
          const { error: deleteError } = await supabase
            .from("device_tokens")
            .delete()
            .eq("fcm_token", fcm_token);

          if (deleteError) {
            console.error("Failed to delete stale token:", deleteError);
          } else {
            cleanedCount++;
            console.log("Stale token deleted successfully");
          }
        }
      }
    }

    console.log(`Push notifications: ${successCount} sent, ${failCount} failed, ${cleanedCount} stale tokens cleaned`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        cleaned: cleanedCount,
        total_tokens: deviceTokens.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Push notification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
