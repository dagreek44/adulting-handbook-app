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

  /**
   * Generate an ICS file content for a reminder
   */
  static generateICSContent(event: CalendarEvent): string {
    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@adulting-app`;
    
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Adulting App//Reminder//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTART:${formatDate(event.startDate)}
DTEND:${formatDate(event.endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
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
    // Format for Google Calendar URL
    const formatGoogleDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const googleCalendarUrl = new URL('https://calendar.google.com/calendar/render');
    googleCalendarUrl.searchParams.set('action', 'TEMPLATE');
    googleCalendarUrl.searchParams.set('text', event.title);
    googleCalendarUrl.searchParams.set('details', event.description || '');
    googleCalendarUrl.searchParams.set('dates', `${formatGoogleDate(event.startDate)}/${formatGoogleDate(event.endDate)}`);
    
    window.open(googleCalendarUrl.toString(), '_blank');
  }

  /**
   * Add reminder to calendar
   * On native: Downloads ICS file which can be opened with default calendar app
   * On web: Opens Google Calendar or downloads ICS
   */
  static async addToCalendar(
    taskId: string,
    title: string,
    description: string,
    dueDate: Date,
    useGoogleCalendar: boolean = false
  ): Promise<boolean> {
    try {
      // Create all-day event for the due date
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
SUMMARY:${event.title}
DESCRIPTION:${event.description || ''}
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
