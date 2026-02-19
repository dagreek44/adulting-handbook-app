import { isNativePlatform, getPlatform, waitForCapacitor, safeNativeCall } from '@/utils/capacitorUtils';
import { supabase } from '@/integrations/supabase/client';

export class DeviceTokenService {
  private static currentUserId: string | null = null;
  private static listenersSetup = false;

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
    
    const isReady = await waitForCapacitor(2000);
    console.log('DeviceTokenService: Capacitor ready:', isReady);
    
    if (!isReady) {
      console.log('DeviceTokenService: Capacitor not ready, skipping initialization');
      return;
    }

    if (!await this.isPushAvailable()) {
      console.log('DeviceTokenService: Push not available');
      return;
    }

    this.currentUserId = userId;

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      // Create notification channel BEFORE registering (Android 8+ requirement)
      await this.createDefaultChannel();
      
      // Check current permission status first
      const permStatus = await PushNotifications.checkPermissions();
      console.log('DeviceTokenService: Current permission status:', permStatus.receive);
      
      if (permStatus.receive !== 'granted') {
        const permResult = await PushNotifications.requestPermissions();
        if (permResult.receive !== 'granted') {
          console.log('DeviceTokenService: Push notification permission denied');
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
      console.error('DeviceTokenService: Failed to initialize:', error);
    }
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
        console.error('DeviceTokenService: Registration failed:', error);
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
        console.error('DeviceTokenService: Failed to save token:', error);
      } else {
        console.log('DeviceTokenService: Token saved successfully');
      }
    } catch (error) {
      console.error('DeviceTokenService: Error saving token:', error);
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
}
