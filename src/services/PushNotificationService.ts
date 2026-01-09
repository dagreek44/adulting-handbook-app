import { supabase } from '@/integrations/supabase/client';

interface PushNotificationPayload {
  user_ids: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
}

export class PushNotificationService {
  private static readonly FUNCTION_URL = 'https://dgwzmfgcuxtsrvcvahat.supabase.co/functions/v1/send-push-notification';

  /**
   * Send push notification to specific users
   */
  static async sendToUsers(payload: PushNotificationPayload): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(this.FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('PushNotificationService: Failed to send notification:', error);
        return false;
      }

      const result = await response.json();
      console.log('PushNotificationService: Notification sent:', result);
      return true;
    } catch (error) {
      console.error('PushNotificationService: Error sending notification:', error);
      return false;
    }
  }

  /**
   * Notify user when a reminder is created for them
   */
  static async notifyReminderCreated(
    recipientUserId: string,
    creatorName: string,
    reminderTitle: string,
    taskId: string
  ): Promise<void> {
    await this.sendToUsers({
      user_ids: [recipientUserId],
      title: 'New Reminder',
      body: `${creatorName} created a reminder for you: ${reminderTitle}`,
      data: { taskId, action: 'openReminder' },
    });
  }

  /**
   * Notify user when a reminder is reassigned to them
   */
  static async notifyReminderReassigned(
    recipientUserId: string,
    reassignerName: string,
    reminderTitle: string,
    taskId: string
  ): Promise<void> {
    await this.sendToUsers({
      user_ids: [recipientUserId],
      title: 'Reminder Reassigned',
      body: `${reassignerName} assigned you a reminder: ${reminderTitle}`,
      data: { taskId, action: 'openReminder' },
    });
  }

  /**
   * Notify creator when their task is completed by someone else
   */
  static async notifyTaskCompleted(
    creatorUserId: string,
    completedByName: string,
    taskTitle: string,
    taskId: string
  ): Promise<void> {
    await this.sendToUsers({
      user_ids: [creatorUserId],
      title: 'Task Completed',
      body: `${completedByName} completed: ${taskTitle}`,
      data: { taskId, action: 'openReminder' },
    });
  }

  /**
   * Send reminder due notification to user
   */
  static async notifyReminderDue(
    recipientUserId: string,
    reminderTitle: string,
    taskId: string
  ): Promise<void> {
    await this.sendToUsers({
      user_ids: [recipientUserId],
      title: 'Reminder Due Today',
      body: `Your task "${reminderTitle}" is due today`,
      data: { taskId, action: 'openReminder' },
    });
  }
}
