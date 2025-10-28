import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FamilyInvitationRequest {
  to: string;
  name: string;
  inviterName: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, name, inviterName, role }: FamilyInvitationRequest = await req.json();

    console.log(`Sending family invitation to ${to} from ${inviterName}`);

    const signUpUrl = `${req.headers.get('origin') || 'https://lovableproject.com'}/auth?email=${encodeURIComponent(to)}&signup=true`;

    const emailResponse = await resend.emails.send({
      from: "Adulting App <welcome@adulting101.co>",
      to: [to],
      subject: `${inviterName} invited you to join their family on Adulting App!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2C5F2D; margin-bottom: 20px;">Welcome to Adulting App!</h1>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Hi ${name},
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Great news! <strong>${inviterName}</strong> has invited you to join their family on Adulting App as a <strong>${role}</strong>.
          </p>
          
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Adulting App helps families manage household reminders, tasks, and maintenance together. By joining, you'll be able to:
          </p>
          
          <ul style="font-size: 16px; line-height: 1.8; color: #333;">
            <li>Share reminders across family members</li>
            <li>View and complete assigned tasks</li>
            <li>Track household maintenance together</li>
            <li>Coordinate schedules and responsibilities</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signUpUrl}" 
               style="background-color: #2C5F2D; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Accept Invitation & Sign Up
            </a>
          </div>
          
          <p style="font-size: 14px; line-height: 1.6; color: #666; margin-top: 30px;">
            This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            Adulting App - Making adulting easier, together
          </p>
        </div>
      `,
    });

    console.log("Family invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-family-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
