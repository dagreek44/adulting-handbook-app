
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupabaseReminder {
  id: string;
  title: string;
  description: string;
  frequency: string;
  difficulty: string;
  estimated_time: string;
  estimated_budget: string;
  due_date: string | null;
  video_url: string | null;
  instructions: string[];
  tools: any[];
  supplies: any[];
  enabled: boolean;
  is_custom: boolean;
  assignees: string[];
  created_at: string;
  updated_at: string;
}

export interface CompletedTask {
  id: string;
  reminder_id: string | null;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  estimated_budget: string;
  completed_at: string;
  created_at: string;
}

export const useSupabaseData = () => {
  const [reminders, setReminders] = useState<SupabaseReminder[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('enabled', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reminders",
        variant: "destructive"
      });
    }
  };

  const fetchCompletedTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('completed_tasks')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(3);

      if (error) throw error;
      setCompletedTasks(data || []);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch completed tasks",
        variant: "destructive"
      });
    }
  };

  const completeTask = async (reminder: SupabaseReminder) => {
    try {
      // Add to completed tasks
      const { error: insertError } = await supabase
        .from('completed_tasks')
        .insert({
          reminder_id: reminder.id,
          title: reminder.title,
          description: reminder.description,
          difficulty: reminder.difficulty,
          estimated_time: reminder.estimated_time,
          estimated_budget: reminder.estimated_budget
        });

      if (insertError) throw insertError;

      // Check if we have more than 3 completed tasks and remove oldest if needed
      const { data: allCompleted, error: fetchError } = await supabase
        .from('completed_tasks')
        .select('*')
        .order('completed_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (allCompleted && allCompleted.length > 3) {
        const tasksToDelete = allCompleted.slice(3);
        const idsToDelete = tasksToDelete.map(task => task.id);
        
        const { error: deleteError } = await supabase
          .from('completed_tasks')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) throw deleteError;
      }

      // Refresh data
      await Promise.all([fetchReminders(), fetchCompletedTasks()]);

      toast({
        title: "Great job! 🎉",
        description: "Task completed successfully!",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive"
      });
    }
  };

  const addReminder = async (reminder: Partial<SupabaseReminder>) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .insert(reminder);

      if (error) throw error;
      await fetchReminders();
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast({
        title: "Error",
        description: "Failed to add reminder",
        variant: "destructive"
      });
    }
  };

  const updateReminder = async (id: string, updates: Partial<SupabaseReminder>) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast({
        title: "Error",
        description: "Failed to update reminder",
        variant: "destructive"
      });
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchReminders();
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast({
        title: "Error",
        description: "Failed to delete reminder",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchReminders(), fetchCompletedTasks()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    reminders,
    completedTasks,
    loading,
    completeTask,
    addReminder,
    updateReminder,
    deleteReminder,
    fetchReminders,
    fetchCompletedTasks
  };
};
