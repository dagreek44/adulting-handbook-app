import { isNativePlatform, safeNativeCall } from '@/utils/capacitorUtils';

export class NotificationService {
  /**
   * Safely check if we're on a native platform
   */
  private static get isNative(): boolean {
    return isNativePlatform();
  }

  /**
   * Safely get LocalNotifications plugin
   */
  private static async getLocalNotifications() {
    if (!this.isNative) {
      return null;
    }
    
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      return LocalNotifications;
    } catch (error) {
      console.error('NotificationService: LocalNotifications not available:', error);
      return null;
    }
  }

  /**
   * Request notification permissions
   */
  static async requestPermissions(): Promise<boolean> {
    return safeNativeCall(async () => {
      const LocalNotifications = await this.getLocalNotifications();
      if (!LocalNotifications) return false;

      const result = await LocalNotifications.requestPermissions();
      return result.display === 'granted';
    }, false);
  }

  /**
   * Schedule a notification for a reminder that's due today
   */
  static async scheduleReminderDueToday(
    taskId: string,
    title: string
  ): Promise<void> {
    await safeNativeCall(async () => {
      const LocalNotifications = await this.getLocalNotifications();
      if (!LocalNotifications) return;

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
    }, undefined);
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
    // Only schedule for medium or hard tasks
    if (difficulty?.toLowerCase() !== 'medium' && difficulty?.toLowerCase() !== 'hard') {
      return;
    }

    await safeNativeCall(async () => {
      const LocalNotifications = await this.getLocalNotifications();
      if (!LocalNotifications) return;

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
            id: parseInt(taskId.substring(0, 8), 16) + 1,
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
    }, undefined);
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
    await safeNativeCall(async () => {
      const LocalNotifications = await this.getLocalNotifications();
      if (!LocalNotifications) return;

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
    }, undefined);
  }

  /**
   * Send immediate notification when a reminder is created for another family member
   */
  static async notifyReminderCreated(
    creatorName: string,
    reminderTitle: string,
    taskId: string
  ): Promise<void> {
    await safeNativeCall(async () => {
      const LocalNotifications = await this.getLocalNotifications();
      if (!LocalNotifications) return;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

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
    }, undefined);
  }

  /**
   * Send notification when a reminder is reassigned to a user
   */
  static async notifyReminderReassigned(
    reassignerName: string,
    reminderTitle: string,
    taskId: string
  ): Promise<void> {
    await safeNativeCall(async () => {
      const LocalNotifications = await this.getLocalNotifications();
      if (!LocalNotifications) return;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

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
    }, undefined);
  }

  /**
   * Send notification when a task is completed to the creator
   */
  static async notifyTaskCompleted(
    completedByName: string,
    taskTitle: string,
    taskId: string
  ): Promise<void> {
    await safeNativeCall(async () => {
      const LocalNotifications = await this.getLocalNotifications();
      if (!LocalNotifications) return;

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return;

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
    }, undefined);
  }

  /**
   * Cancel a scheduled notification
   */
  static async cancelNotification(taskId: string): Promise<void> {
    await safeNativeCall(async () => {
      const LocalNotifications = await this.getLocalNotifications();
      if (!LocalNotifications) return;

      const notificationId = parseInt(taskId.substring(0, 8), 16);
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
      // Also cancel the advance notification
      await LocalNotifications.cancel({ notifications: [{ id: notificationId + 1 }] });
    }, undefined);
  }

  /**
   * Listen for notification clicks and navigate to the reminder
   */
  static async setupNotificationListeners(onNotificationClick: (taskId: string) => void): Promise<void> {
    await safeNativeCall(async () => {
      const LocalNotifications = await this.getLocalNotifications();
      if (!LocalNotifications) return;

      await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        const taskId = notification.notification.extra?.taskId;
        if (taskId && notification.notification.extra?.action === 'openReminder') {
          onNotificationClick(taskId);
        }
      });
    }, undefined);
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
