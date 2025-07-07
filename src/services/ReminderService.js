
import { supabase } from '../integrations/supabase/client';

export class ReminderService {
  // Get all global reminders
  static async getReminders() {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      
      // Convert frequency string to frequency_days for backward compatibility
      const remindersWithDays = (data || []).map(reminder => ({
        ...reminder,
        frequency_days: this.getFrequencyDays(reminder.frequency)
      }));
      
      return remindersWithDays;
    } catch (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }
  }

  // Get a single reminder by ID
  static async getReminderById(id) {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Add frequency_days for backward compatibility
      return {
        ...data,
        frequency_days: this.getFrequencyDays(data.frequency)
      };
    } catch (error) {
      console.error('Error fetching reminder by ID:', error);
      return null;
    }
  }

  // Add a new global reminder (admin function)
  static async addReminder(reminder) {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .insert([{
          title: reminder.title,
          description: reminder.description || '',
          frequency_days: reminder.frequency_days || 30,
          frequency: reminder.frequency || this.getFrequencyString(reminder.frequency_days || 30),
          category: reminder.category || 'maintenance',
          difficulty: reminder.difficulty || 'Easy',
          estimated_time: reminder.estimated_time || '30 min',
          estimated_budget: reminder.estimated_budget || '',
          video_url: reminder.video_url || null,
          instructions: reminder.instructions || [],
          tools: reminder.tools || [],
          supplies: reminder.supplies || []
        }])
        .select()
        .single();

      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  }

  // Helper method to convert frequency string to days
  static getFrequencyDays(frequency) {
    switch (frequency) {
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'quarterly': return 90;
      case 'seasonally': return 90;
      case 'yearly': return 365;
      default: return 30;
    }
  }

  // Helper method to convert frequency days to string
  static getFrequencyString(days) {
    if (days <= 7) return 'weekly';
    if (days <= 30) return 'monthly';
    if (days <= 90) return 'quarterly';
    if (days <= 180) return 'seasonally';
    return 'yearly';
  }
}
