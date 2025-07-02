
import { supabase } from '@/integrations/supabase/client';

export const getReminders = async () => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('getReminders: No user available');
      return [];
    }

    console.log('getReminders: Fetching enabled tasks for user:', user.id);
    const { data, error } = await supabase
      .from('user_tasks')
      .select(`
        *,
        reminders (
          title,
          description,
          difficulty,
          estimated_time,
          estimated_budget,
          video_url,
          instructions,
          tools,
          supplies,
          assignees,
          is_custom,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .eq('enabled', true)
      .order('due_date', { ascending: true });

    if (error) throw error;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const enrichedTasks = (data || []).map(task => {
      const reminderData = task.reminders;
      const isPastDue = new Date(task.due_date) < today;
      
      return {
        id: task.id,
        reminder_id: task.reminder_id,
        completed_date: task.completed_date,
        enabled: task.enabled,
        due_date: task.due_date,
        frequency: task.frequency,
        reminder_type: task.reminder_type,
        created_at: task.created_at,
        title: reminderData?.title || 'Unknown Task',
        description: reminderData?.description || '',
        difficulty: reminderData?.difficulty || 'Easy',
        estimated_time: reminderData?.estimated_time || '30 min',
        estimated_budget: reminderData?.estimated_budget || '',
        video_url: reminderData?.video_url,
        instructions: Array.isArray(reminderData?.instructions) ? reminderData.instructions : [],
        tools: Array.isArray(reminderData?.tools) ? reminderData.tools : [],
        supplies: Array.isArray(reminderData?.supplies) ? reminderData.supplies : [],
        assignees: Array.isArray(reminderData?.assignees) ? reminderData.assignees : [],
        is_custom: reminderData?.is_custom || false,
        updated_at: reminderData?.updated_at || task.created_at,
        isPastDue,
        assignedToNames: ['Family'] // Default assignment
      };
    });
    
    console.log('getReminders: Found', enrichedTasks.length, 'enabled user tasks');
    return enrichedTasks;
  } catch (error) {
    console.error('Error fetching reminders:', error);
    throw error;
  }
};
