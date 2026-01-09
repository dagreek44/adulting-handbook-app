import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

export class DeviceTokenService {
  private static isNative = Capacitor.isNativePlatform();
  private static currentUserId: string | null = null;

  /**
   * Initialize push notifications and register device token
   */
  static async initialize(userId: string): Promise<void> {
    if (!this.isNative) {
      console.log('DeviceTokenService: Not on native platform, skipping initialization');
      return;
    }

    this.currentUserId = userId;

    try {
      // Request permission
      const permResult = await PushNotifications.requestPermissions();
      
      if (permResult.receive !== 'granted') {
        console.log('DeviceTokenService: Push notification permission denied');
        return;
      }

      // Register for push notifications
      await PushNotifications.register();

      // Setup listeners
      this.setupListeners();
      
      console.log('DeviceTokenService: Initialized successfully');
    } catch (error) {
      console.error('DeviceTokenService: Failed to initialize:', error);
    }
  }

  /**
   * Setup push notification listeners
   */
  private static setupListeners(): void {
    // On registration success
    PushNotifications.addListener('registration', async (token) => {
      console.log('DeviceTokenService: Registration successful, token:', token.value.substring(0, 20) + '...');
      await this.saveToken(token.value);
    });

    // On registration error
    PushNotifications.addListener('registrationError', (error) => {
      console.error('DeviceTokenService: Registration failed:', error);
    });

    // On push notification received (foreground)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('DeviceTokenService: Push notification received in foreground:', notification);
    });

    // On push notification action performed (tapped)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('DeviceTokenService: Push notification tapped:', notification);
      
      // Extract task ID from notification data and navigate
      const taskId = notification.notification.data?.taskId;
      if (taskId) {
        // Dispatch custom event for navigation
        window.dispatchEvent(new CustomEvent('push-notification-tap', { 
          detail: { taskId } 
        }));
      }
    });
  }

  /**
   * Save FCM token to database
   */
  private static async saveToken(fcmToken: string): Promise<void> {
    if (!this.currentUserId) {
      console.error('DeviceTokenService: No user ID available');
      return;
    }

    try {
      const platform = Capacitor.getPlatform() as 'ios' | 'android' | 'web';
      
      // Upsert the token (insert or update if exists)
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
        console.error('DeviceTokenService: Failed to save token:', error);
      } else {
        console.log('DeviceTokenService: Token saved successfully');
      }
    } catch (error) {
      console.error('DeviceTokenService: Error saving token:', error);
    }
  }

  /**
   * Remove device token on logout
   */
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
    } catch (error) {
      console.error('DeviceTokenService: Error removing token:', error);
    }
  }
}
