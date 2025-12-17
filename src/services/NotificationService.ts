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
  static async scheduleReminderDueToday(
    taskId: string,
    title: string
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
            id: parseInt(taskId.substring(0, 8), 16),
            title: 'Reminder Due Today',
            body: `Your task to ${title} is due today.`,
            schedule: { at: new Date(Date.now() + 1000) },
            extra: {
              taskId,
              action: 'openReminder'
            }
          }
        ]
      });

      console.log('NotificationService: Sent due today notification for', title);
    } catch (error) {
      console.error('NotificationService: Failed to schedule notification:', error);
    }
  }

  /**
   * Schedule a notification 1 week in advance for medium/hard tasks
   */
  static async scheduleAdvanceNotification(
    taskId: string,
    title: string,
    dueDate: Date,
    difficulty: string
  ): Promise<void> {
    if (!this.isNative) {
      console.log('NotificationService: Not on native platform, skipping notification');
      return;
    }

    // Only schedule for medium or hard tasks
    if (difficulty?.toLowerCase() !== 'medium' && difficulty?.toLowerCase() !== 'hard') {
      return;
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('NotificationService: No notification permission');
        return;
      }

      // Schedule 1 week before due date at 9 AM
      const oneWeekBefore = new Date(dueDate);
      oneWeekBefore.setDate(oneWeekBefore.getDate() - 7);
      oneWeekBefore.setHours(9, 0, 0, 0);

      // Don't schedule if the date has already passed
      if (oneWeekBefore <= new Date()) {
        console.log('NotificationService: Advance notification date has passed, skipping');
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(taskId.substring(0, 8), 16) + 1, // Different ID for advance notification
            title: 'Big Task Coming Up',
            body: 'You have a big task due next week. Make sure you have all the supplies to get it done.',
            schedule: { at: oneWeekBefore },
            extra: {
              taskId,
              action: 'openReminder'
            }
          }
        ]
      });

      console.log('NotificationService: Scheduled advance notification for', title, 'at', oneWeekBefore);
    } catch (error) {
      console.error('NotificationService: Failed to schedule advance notification:', error);
    }
  }

  /**
   * Schedule notification for 8 AM on the due date
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

      const notificationTime = new Date(dueDate);
      notificationTime.setHours(8, 0, 0, 0);

      // Don't schedule if the date has already passed
      if (notificationTime <= new Date()) {
        // Send immediately if due today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDateStart = new Date(dueDate);
        dueDateStart.setHours(0, 0, 0, 0);
        
        if (dueDateStart.getTime() === today.getTime()) {
          await this.scheduleReminderDueToday(taskId, title);
        }
        return;
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            id: parseInt(taskId.substring(0, 8), 16),
            title: 'Reminder Due Today',
            body: `Your task to ${title} is due today.`,
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
            title: 'New Reminder',
            body: `${creatorName} created a reminder: ${reminderTitle}`,
            schedule: { at: new Date(Date.now() + 1000) },
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
   * Send notification when a reminder is reassigned to a user
   */
  static async notifyReminderReassigned(
    reassignerName: string,
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
            title: 'Reminder Re-assigned',
            body: `${reassignerName} re-assigned a reminder: ${reminderTitle}`,
            schedule: { at: new Date(Date.now() + 1000) },
            extra: {
              taskId,
              action: 'openReminder'
            }
          }
        ]
      });

      console.log('NotificationService: Sent reassignment notification for', reminderTitle);
    } catch (error) {
      console.error('NotificationService: Failed to send reassignment notification:', error);
    }
  }

  /**
   * Send notification when a task is completed to the creator
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
            schedule: { at: new Date(Date.now() + 1000) },
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
      // Also cancel the advance notification
      await LocalNotifications.cancel({ notifications: [{ id: notificationId + 1 }] });
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

  /**
   * Check and schedule notifications for all user tasks
   */
  static async scheduleAllTaskNotifications(
    tasks: Array<{ id: string; title: string; due_date: string; difficulty?: string; user_id?: string }>,
    currentUserId: string
  ): Promise<void> {
    if (!this.isNative) return;

    for (const task of tasks) {
      // Only schedule for tasks assigned to current user
      if (task.user_id !== currentUserId) continue;

      const dueDate = new Date(task.due_date);
      
      // Schedule due date notification
      await this.scheduleReminderNotification(
        task.id,
        task.title || 'Reminder',
        '',
        dueDate
      );

      // Schedule advance notification for medium/hard tasks
      if (task.difficulty) {
        await this.scheduleAdvanceNotification(
          task.id,
          task.title || 'Reminder',
          dueDate,
          task.difficulty
        );
      }
    }
  }
}
