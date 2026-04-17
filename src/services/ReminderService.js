import { supabase } from '../integrations/supabase/client';

const FREQ_TO_DAYS = { weekly: 7, monthly: 30, quarterly: 90, seasonally: 90, yearly: 365 };

export class ReminderService {
  // Get all global reminders
  static async getReminders() {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;

      return (data || []).map(r => ({
        ...r,
        frequency_days: FREQ_TO_DAYS[r.frequency] ?? 30,
      }));
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
      return {
        ...data,
        frequency_days: FREQ_TO_DAYS[data.frequency] ?? 30,
        why: data.why || null,
      };
    } catch (error) {
      console.error('Error fetching reminder by ID:', error);
      return null;
    }
  }

  static getFrequencyDays(frequency) {
    return FREQ_TO_DAYS[frequency] ?? 30;
  }
}
