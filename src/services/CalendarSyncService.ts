import { Capacitor } from '@capacitor/core';

export interface CalendarEvent {
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
}

export class CalendarSyncService {
  private static isNative = Capacitor.isNativePlatform();
  private static platform = Capacitor.getPlatform();

  /**
   * Generate an ICS file content for a reminder
   */
  static generateICSContent(event: CalendarEvent): string {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@adulting-app`;
    
    // Escape special characters in text fields
    const escapeText = (text: string) => {
      return text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
    };
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Adulting App//Reminder//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTART:${formatDate(event.startDate)}
DTEND:${formatDate(event.endDate)}
SUMMARY:${escapeText(event.title)}
DESCRIPTION:${escapeText(event.description || '')}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT
END:VCALENDAR`;
  }

  /**
   * Detect platform and automatically add to native calendar
   */
  static async addToNativeCalendar(event: CalendarEvent): Promise<boolean> {
    try {
      console.log('CalendarSyncService: Platform detected:', this.platform, 'isNative:', this.isNative);
      
      if (this.platform === 'ios') {
        return this.addToiOSCalendar(event);
      } else if (this.platform === 'android') {
        return this.addToAndroidCalendar(event);
      } else {
        // Web fallback - use ICS download
        this.downloadICSFile(event);
        return true;
      }
    } catch (error) {
      console.error('CalendarSyncService: Failed to add to native calendar:', error);
      // Fallback to ICS download
      this.downloadICSFile(event);
      return true;
    }
  }

  /**
   * Add event to iOS Calendar using URL scheme
   */
  private static addToiOSCalendar(event: CalendarEvent): boolean {
    try {
      // Format dates for iOS calendar URL
      const formatIOSDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      // Use calshow:// or webcal:// for iOS
      // iOS supports opening calendar app with a specific date
      const startTimestamp = Math.floor(event.startDate.getTime() / 1000);
      
      // Try calendar URL scheme - opens to specific date
      const calendarUrl = `calshow:${startTimestamp}`;
      
      // For adding events, we need to use the ICS approach on iOS
      // as there's no direct "add event" URL scheme
      this.downloadICSFile(event);
      
      console.log('CalendarSyncService: iOS calendar file created');
      return true;
    } catch (error) {
      console.error('CalendarSyncService: iOS calendar error:', error);
      return false;
    }
  }

  /**
   * Add event to Android Calendar using Intent URL
   */
  private static addToAndroidCalendar(event: CalendarEvent): boolean {
    try {
      // Android supports content:// intents for calendar
      // Format: content://com.android.calendar/events
      // Or use Google Calendar intent URL
      
      const startTime = event.startDate.getTime();
      const endTime = event.endDate.getTime();
      
      // Use intent URL that works on Android
      const intentUrl = `intent://com.android.calendar/time/${startTime}#Intent;scheme=content;package=com.google.android.calendar;end`;
      
      // Fallback: Use Google Calendar web URL which Android will offer to open in app
      const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
      googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
      googleCalendarUrl.searchParams.set('text', event.title);
      googleCalendarUrl.searchParams.set('details', event.description || '');
      googleCalendarUrl.searchParams.set('dates', 
        `${this.formatGoogleDate(event.startDate)}/${this.formatGoogleDate(event.endDate)}`
      );
      
      // On Android, this will prompt to open in Calendar app or browser
      window.open(googleCalendarUrl.toString(), '_system');
      
      console.log('CalendarSyncService: Android calendar intent triggered');
      return true;
    } catch (error) {
      console.error('CalendarSyncService: Android calendar error:', error);
      // Fallback to ICS
      this.downloadICSFile(event);
      return true;
    }
  }

  /**
   * Format date for Google Calendar URL
   */
  private static formatGoogleDate(date: Date): string {
    return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  /**
   * Download ICS file for web browsers
   */
  static downloadICSFile(event: CalendarEvent): void {
    const icsContent = this.generateICSContent(event);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Open calendar URL (works on mobile and desktop)
   */
  static openCalendarUrl(event: CalendarEvent): void {
    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.set('text', event.title);
    googleCalendarUrl.searchParams.set('details', event.description || '');
    googleCalendarUrl.searchParams.set('dates', 
      `${this.formatGoogleDate(event.startDate)}/${this.formatGoogleDate(event.endDate)}`
    );
    
    window.open(googleCalendarUrl.toString(), '_blank');
  }

  /**
   * Automatically sync a reminder to the device's native calendar
   * Detects iOS/Android and uses appropriate method
   */
  static async syncToDeviceCalendar(
    taskId: string,
    title: string,
    description: string,
    dueDate: Date
  ): Promise<boolean> {
    try {
      // Create event with 1-hour duration starting at 9 AM
      const startDate = new Date(dueDate);
      startDate.setHours(9, 0, 0, 0);
      
      const endDate = new Date(dueDate);
      endDate.setHours(10, 0, 0, 0);

      const event: CalendarEvent = {
        title: `📋 ${title}`,
        description: description || 'Adulting reminder',
        startDate,
        endDate,
      };

      const success = await this.addToNativeCalendar(event);
      
      if (success) {
        console.log('CalendarSyncService: Successfully synced to device calendar:', title);
      }
      
      return success;
    } catch (error) {
      console.error('CalendarSyncService: Failed to sync to device calendar:', error);
      return false;
    }
  }

  /**
   * Legacy method - kept for backwards compatibility
   * @deprecated Use syncToDeviceCalendar instead
   */
  static async addToCalendar(
    taskId: string,
    title: string,
    description: string,
    dueDate: Date,
    useGoogleCalendar: boolean = false
  ): Promise<boolean> {
    try {
      const startDate = new Date(dueDate);
      startDate.setHours(9, 0, 0, 0);
      
      const endDate = new Date(dueDate);
      endDate.setHours(10, 0, 0, 0);

      const event: CalendarEvent = {
        title: `📋 ${title}`,
        description: description || 'Adulting reminder',
        startDate,
        endDate,
      };

      if (useGoogleCalendar) {
        this.openCalendarUrl(event);
      } else {
        this.downloadICSFile(event);
      }

      console.log('CalendarSyncService: Added event to calendar:', title);
      return true;
    } catch (error) {
      console.error('CalendarSyncService: Failed to add to calendar:', error);
      return false;
    }
  }

  /**
   * Export multiple reminders as a single ICS file
   */
  static exportMultipleReminders(events: CalendarEvent[]): void {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const escapeText = (text: string) => {
      return text.replace(/[,;\\]/g, '\\$&').replace(/\n/g, '\\n');
    };

    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Adulting App//Reminders//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
`;

    events.forEach((event, index) => {
      const uid = `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}@adulting-app`;
      icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTART:${formatDate(event.startDate)}
DTEND:${formatDate(event.endDate)}
SUMMARY:${escapeText(event.title)}
DESCRIPTION:${escapeText(event.description || '')}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reminder
END:VALARM
END:VEVENT
`;
    });

    icsContent += 'END:VCALENDAR';

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'adulting-reminders.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
