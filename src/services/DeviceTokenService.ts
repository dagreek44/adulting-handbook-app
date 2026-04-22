import { isNativePlatform, getPlatform, waitForCapacitor } from '@/utils/capacitorUtils';
import { supabase } from '@/integrations/supabase/client';

export interface NotificationDiagnostics {
  isNative: boolean;
  platform: 'ios' | 'android' | 'web';
  permissionStatus: string;
  tokenRegistered: boolean;
  lastError: string | null;
  lastErrorAt: string | null;
}

export class DeviceTokenService {
  private static currentUserId: string | null = null;
  private static listenersSetup = false;
  private static lastError: string | null = null;
  private static lastErrorAt: string | null = null;
  private static lastPermissionStatus: string = 'unknown';

  private static get isNative(): boolean {
    return isNativePlatform();
  }

  private static get platform(): 'ios' | 'android' | 'web' {
    return getPlatform();
  }

  private static async isPushAvailable(): Promise<boolean> {
    if (!this.isNative) {
      console.log('DeviceTokenService: Not on native platform');
      return false;
    }

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      return !!PushNotifications;
    } catch (error) {
      console.error('DeviceTokenService: Push notifications not available:', error);
      return false;
    }
  }

  /**
   * Create default notification channel for Android 8+
   */
  private static async createDefaultChannel(): Promise<void> {
    if (this.platform !== 'android') return;

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      await PushNotifications.createChannel({
        id: 'default',
        name: 'Default',
        description: 'Default notification channel',
        importance: 5, // high
        visibility: 1, // public
        sound: 'default',
        vibration: true,
      });
      console.log('DeviceTokenService: Default notification channel created');
    } catch (error) {
      console.error('DeviceTokenService: Failed to create notification channel:', error);
    }
  }

  /**
   * Initialize push notifications and register device token.
   * Called every app open to ensure fresh tokens.
   */
  static async initialize(userId: string): Promise<void> {
    console.log('DeviceTokenService: Initialize called for user:', userId);

    const isReady = await waitForCapacitor(5000);
    console.log('DeviceTokenService: Capacitor ready:', isReady);

    if (!isReady) {
      console.warn('DeviceTokenService: Capacitor not ready — push notifications will not register this session');
      this.recordError('Capacitor not ready');
      return;
    }

    if (!await this.isPushAvailable()) {
      console.warn('DeviceTokenService: Push plugin not available on this build');
      this.recordError('Push plugin unavailable');
      return;
    }

    // CRITICAL: ensure auth session is hydrated before saveToken hits RLS
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.warn('DeviceTokenService: No active session yet, aborting init');
      this.recordError('No auth session at init');
      return;
    }
    if (session.user.id !== userId) {
      console.warn('DeviceTokenService: session userId mismatch', { expected: userId, actual: session.user.id });
    }

    this.currentUserId = userId;

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      // Create notification channel BEFORE registering (Android 8+ requirement)
      await this.createDefaultChannel();

      // Check current permission status first (handles Android 13+ POST_NOTIFICATIONS)
      const permStatus = await PushNotifications.checkPermissions();
      this.lastPermissionStatus = permStatus.receive;
      console.log('DeviceTokenService: Current permission status:', permStatus.receive, 'platform:', this.platform);

      if (permStatus.receive !== 'granted') {
        console.log('DeviceTokenService: Requesting push permission...');
        const permResult = await PushNotifications.requestPermissions();
        this.lastPermissionStatus = permResult.receive;
        console.log('DeviceTokenService: Permission request result:', permResult.receive);
        if (permResult.receive !== 'granted') {
          console.warn('DeviceTokenService: Push notification permission denied by user');
          this.recordError(`Permission denied: ${permResult.receive}`);
          return;
        }
      }

      // Setup listeners only once per app session
      if (!this.listenersSetup) {
        await this.setupListeners();
        this.listenersSetup = true;
      }

      // Always register to get a fresh token
      await PushNotifications.register();
      console.log('DeviceTokenService: Register called (fresh token requested)');
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('DeviceTokenService: Failed to initialize:', { message: msg, error });
      this.recordError(`Init failed: ${msg}`);
    }
  }

  private static recordError(msg: string): void {
    this.lastError = msg;
    this.lastErrorAt = new Date().toISOString();
  }

  private static async setupListeners(): Promise<void> {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      
      await PushNotifications.removeAllListeners();

      await PushNotifications.addListener('registration', async (token) => {
        console.log('DeviceTokenService: Registration successful, token:', token.value.substring(0, 20) + '...');
        await this.saveToken(token.value);
      });

      await PushNotifications.addListener('registrationError', (error) => {
        const detail = JSON.stringify(error);
        console.error('DeviceTokenService: Registration failed:', {
          error: detail,
          platform: this.platform,
          userId: this.currentUserId,
        });
        this.recordError(`Registration error: ${detail}`);
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('DeviceTokenService: Push notification received in foreground:', notification);
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('DeviceTokenService: Push notification tapped:', notification);
        const taskId = notification.notification.data?.taskId;
        if (taskId) {
          window.dispatchEvent(new CustomEvent('push-notification-tap', { 
            detail: { taskId } 
          }));
        }
      });
      
      console.log('DeviceTokenService: Listeners setup complete');
    } catch (error) {
      console.error('DeviceTokenService: Failed to setup listeners:', error);
    }
  }

  private static async saveToken(fcmToken: string): Promise<void> {
    if (!this.currentUserId) {
      console.error('DeviceTokenService: No user ID available');
      this.recordError('saveToken called with no user ID');
      return;
    }

    try {
      const platform = this.platform;
      
      const { error } = await supabase
        .from('device_tokens')
        .upsert(
          {
            user_id: this.currentUserId,
            fcm_token: fcmToken,
            device_platform: platform,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,fcm_token',
          }
        );

      if (error) {
        console.error('DeviceTokenService: Failed to save token:', {
          message: error.message,
          code: error.code,
          details: error.details,
          userId: this.currentUserId,
          platform,
        });
        this.recordError(`Save token failed: ${error.message}`);
      } else {
        console.log('DeviceTokenService: Token saved successfully');
        this.lastError = null;
        this.lastErrorAt = null;
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('DeviceTokenService: Error saving token:', msg);
      this.recordError(`Save token exception: ${msg}`);
    }
  }

  static async removeToken(): Promise<void> {
    if (!this.isNative || !this.currentUserId) return;

    try {
      const { error } = await supabase
        .from('device_tokens')
        .delete()
        .eq('user_id', this.currentUserId);

      if (error) {
        console.error('DeviceTokenService: Failed to remove token:', error);
      } else {
        console.log('DeviceTokenService: Token removed successfully');
      }

      this.currentUserId = null;
      this.listenersSetup = false;
    } catch (error) {
      console.error('DeviceTokenService: Error removing token:', error);
    }
  }

  /**
   * Get current diagnostics for the in-app status widget.
   */
  static async getDiagnostics(userId: string): Promise<NotificationDiagnostics> {
    let tokenRegistered = false;
    try {
      const { data } = await supabase
        .from('device_tokens')
        .select('id')
        .eq('user_id', userId)
        .limit(1);
      tokenRegistered = !!(data && data.length > 0);
    } catch (e) {
      console.warn('DeviceTokenService.getDiagnostics: token lookup failed', e);
    }

    return {
      isNative: this.isNative,
      platform: this.platform,
      permissionStatus: this.lastPermissionStatus,
      tokenRegistered,
      lastError: this.lastError,
      lastErrorAt: this.lastErrorAt,
    };
  }
}
