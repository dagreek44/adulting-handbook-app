import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export class NotificationService {
  private static isNative = Capacitor.isNativePlatform();

  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    if (!this.isNative) {
      console.log('NotificationService: Not on native platform, skipping permission request');
      return false;
    }

    try {
      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    } catch (error) {
      console.error('NotificationService: Failed to request permissions:', error);
      return false;
    }
  }

  /**
   * Schedule a notification for a reminder that's due today
   */
  static async scheduleReminderNotification(
    taskId: string,
    title: string,
    description: string,
    dueDate: Date
  ): Promise<void> {
    if (!this.isNative) {
      console.log('NotificationService: Not on native platform, skipping notification');
      return;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('NotificationService: No notification permission');
        return;
      }

      // Schedule notification for 8 AM on the due date
      const notificationTime = new Date(dueDate);
      notificationTime.setHours(8, 0, 0, 0);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(taskId.substring(0, 8), 16), // Convert UUID to number
            title: `Reminder: ${title}`,
            body: description || 'You have a task due today!',
            schedule: { at: notificationTime },
            extra: {
              taskId,
              action: 'openReminder'
            }
          }
        ]
      });

      console.log('NotificationService: Scheduled notification for', title, 'at', notificationTime);
    } catch (error) {
      console.error('NotificationService: Failed to schedule notification:', error);
    }
  }

  /**
   * Send immediate notification when a reminder is created for another family member
   */
  static async notifyReminderCreated(
    creatorName: string,
    assigneeName: string,
    reminderTitle: string,
    taskId: string
  ): Promise<void> {
    if (!this.isNative) {
      console.log('NotificationService: Not on native platform, skipping notification');
      return;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('NotificationService: No notification permission');
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 100000),
            title: `New Reminder from ${creatorName}`,
            body: `${creatorName} created a reminder for you: ${reminderTitle}`,
            schedule: { at: new Date(Date.now() + 1000) }, // Show in 1 second
            extra: {
              taskId,
              action: 'openReminder'
            }
          }
        ]
      });

      console.log('NotificationService: Sent notification about new reminder from', creatorName);
    } catch (error) {
      console.error('NotificationService: Failed to send notification:', error);
    }
  }

  /**
   * Send notification when a task is completed
   */
  static async notifyTaskCompleted(
    completedByName: string,
    taskTitle: string,
    taskId: string
  ): Promise<void> {
    if (!this.isNative) {
      console.log('NotificationService: Not on native platform, skipping notification');
      return;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('NotificationService: No notification permission');
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 100000),
            title: 'Task Completed',
            body: `${completedByName} completed: ${taskTitle}`,
            schedule: { at: new Date(Date.now() + 1000) }, // Show in 1 second
            extra: {
              taskId,
              action: 'openReminder'
            }
          }
        ]
      });

      console.log('NotificationService: Sent task completion notification for', taskTitle);
    } catch (error) {
      console.error('NotificationService: Failed to send completion notification:', error);
    }
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(taskId: string): Promise<void> {
    if (!this.isNative) return;

    try {
      const notificationId = parseInt(taskId.substring(0, 8), 16);
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
    } catch (error) {
      console.error('NotificationService: Failed to cancel notification:', error);
    }
  }

  /**
   * Listen for notification clicks and navigate to the reminder
   */
  static setupNotificationListeners(onNotificationClick: (taskId: string) => void): void {
    if (!this.isNative) return;

    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      const taskId = notification.notification.extra?.taskId;
      if (taskId && notification.notification.extra?.action === 'openReminder') {
        onNotificationClick(taskId);
      }
    });
  }
}
