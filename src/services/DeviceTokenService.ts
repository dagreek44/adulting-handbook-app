import { isNativePlatform, getPlatform, waitForCapacitor, safeNativeCall } from '@/utils/capacitorUtils';
import { supabase } from '@/integrations/supabase/client';

export class DeviceTokenService {
  private static currentUserId: string | null = null;
  private static isInitialized = false;

  /**
   * Check if we're running on a native platform
   */
  private static get isNative(): boolean {
    return isNativePlatform();
  }

  /**
   * Get platform safely
   */
  private static get platform(): 'ios' | 'android' | 'web' {
    return getPlatform();
  }

  /**
   * Check if push notifications are available
   */
  private static async isPushAvailable(): Promise<boolean> {
    if (!this.isNative) {
      console.log('DeviceTokenService: Not on native platform');
      return false;
    }

    try {
      // Dynamically import to prevent crashes if not available
      const { PushNotifications } = await import('@capacitor/push-notifications');
      return !!PushNotifications;
    } catch (error) {
      console.error('DeviceTokenService: Push notifications not available:', error);
      return false;
    }
  }

  /**
   * Initialize push notifications and register device token
   */
  static async initialize(userId: string): Promise<void> {
    console.log('DeviceTokenService: Initialize called for user:', userId);
    
    // Wait for Capacitor to be fully ready
    const isReady = await waitForCapacitor(2000);
    console.log('DeviceTokenService: Capacitor ready:', isReady);
    
    if (!isReady) {
      console.log('DeviceTokenService: Capacitor not ready, skipping initialization');
      return;
    }

    if (this.isInitialized) {
      console.log('DeviceTokenService: Already initialized');
      return;
    }

    if (!await this.isPushAvailable()) {
      console.log('DeviceTokenService: Push not available');
      return;
    }

    this.currentUserId = userId;

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      
      // Check current permission status first
      const permStatus = await PushNotifications.checkPermissions();
      console.log('DeviceTokenService: Current permission status:', permStatus.receive);
      
      // Request permission if not granted
      if (permStatus.receive !== 'granted') {
        const permResult = await PushNotifications.requestPermissions();
        
        if (permResult.receive !== 'granted') {
          console.log('DeviceTokenService: Push notification permission denied');
          return;
        }
      }

      // Setup listeners before registering
      await this.setupListeners();

      // Register for push notifications
      await PushNotifications.register();
      
      this.isInitialized = true;
      console.log('DeviceTokenService: Initialized successfully');
    } catch (error) {
      console.error('DeviceTokenService: Failed to initialize:', error);
      // Don't crash the app if push notifications fail
      this.isInitialized = false;
    }
  }

  /**
   * Setup push notification listeners
   */
  private static async setupListeners(): Promise<void> {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      
      // Remove any existing listeners first
      await PushNotifications.removeAllListeners();

      // On registration success
      await PushNotifications.addListener('registration', async (token) => {
        console.log('DeviceTokenService: Registration successful, token:', token.value.substring(0, 20) + '...');
        await this.saveToken(token.value);
      });

      // On registration error
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('DeviceTokenService: Registration failed:', error);
      });

      // On push notification received (foreground)
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('DeviceTokenService: Push notification received in foreground:', notification);
      });

      // On push notification action performed (tapped)
      await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('DeviceTokenService: Push notification tapped:', notification);
        
        // Extract task ID from notification data and navigate
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

  /**
   * Save FCM token to database
   */
  private static async saveToken(fcmToken: string): Promise<void> {
    if (!this.currentUserId) {
      console.error('DeviceTokenService: No user ID available');
      return;
    }

    try {
      const platform = this.platform;
      
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
      this.isInitialized = false;
    } catch (error) {
      console.error('DeviceTokenService: Error removing token:', error);
    }
  }
}
