
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type SupabaseReminderRow = Database['public']['Tables']['reminders']['Row'];
type SupabaseReminderInsert = Database['public']['Tables']['reminders']['Insert'];
type SupabaseReminderUpdate = Database['public']['Tables']['reminders']['Update'];
type FamilyMemberRow = Database['public']['Tables']['family_members']['Row'];

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
  isPastDue?: boolean;
  assignedToNames?: string[];
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
  completed_date: string | null;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member';
  adulting_progress: number;
  invited_at: string;
  created_at: string;
  updated_at: string;
}

// Helper function to convert Supabase row to our interface
const convertSupabaseRowToReminder = (row: SupabaseReminderRow): SupabaseReminder => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  frequency: row.frequency,
  difficulty: row.difficulty || 'Easy',
  estimated_time: row.estimated_time || '30 min',
  estimated_budget: row.estimated_budget || '',
  due_date: row.due_date,
  video_url: row.video_url,
  instructions: row.instructions || [],
  tools: Array.isArray(row.tools) ? row.tools : [],
  supplies: Array.isArray(row.supplies) ? row.supplies : [],
  enabled: row.enabled || true,
  is_custom: row.is_custom || false,
  assignees: row.assignees || [],
  created_at: row.created_at,
  updated_at: row.updated_at
});

const convertFamilyMemberRow = (row: FamilyMemberRow): FamilyMember => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role as 'Admin' | 'Member',
  adulting_progress: row.adulting_progress || 0,
  invited_at: row.invited_at,
  created_at: row.created_at,
  updated_at: row.updated_at
});

export const useSupabaseData = () => {
  const [reminders, setReminders] = useState<SupabaseReminder[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFamilyMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const convertedMembers = (data || []).map(convertFamilyMemberRow);
      setFamilyMembers(convertedMembers);
      return convertedMembers;
    } catch (error) {
      console.error('Error fetching family members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch family members",
        variant: "destructive"
      });
      return [];
    }
  };

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('enabled', true)
        .order('due_date', { ascending: true, nullsFirst: true });

      if (error) throw error;
      
      const convertedReminders = (data || []).map(convertSupabaseRowToReminder);
      
      // Get family members for assignment names
      const members = await fetchFamilyMembers();
      
      // Add past due flags and assignment names
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const enrichedReminders = convertedReminders.map(reminder => {
        const isPastDue = reminder.due_date ? new Date(reminder.due_date) < today : false;
        
        let assignedToNames: string[] = [];
        if (reminder.assignees && reminder.assignees.length > 0) {
          assignedToNames = reminder.assignees
            .map(assigneeId => members.find(m => m.id === assigneeId)?.name)
            .filter(Boolean) as string[];
        }
        
        if (assignedToNames.length === 0) {
          assignedToNames = ['Family'];
        }
        
        return {
          ...reminder,
          isPastDue,
          assignedToNames
        };
      });
      
      setReminders(enrichedReminders);
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
      const today = new Date();
      const completedDate = today.toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
      
      // Add to completed tasks with completed_date
      const { error: insertError } = await supabase
        .from('completed_tasks')
        .insert({
          reminder_id: reminder.id,
          title: reminder.title,
          description: reminder.description,
          difficulty: reminder.difficulty,
          estimated_time: reminder.estimated_time,
          estimated_budget: reminder.estimated_budget,
          completed_date: completedDate
        });

      if (insertError) throw insertError;

      // Calculate new due date based on today's date plus frequency
      let newDueDate: string | null = null;
      if (reminder.frequency !== 'once') {
        const nextDate = new Date(today);
        
        switch (reminder.frequency) {
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7);
            break;
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDate.setDate(nextDate.getDate() + 90);
            break;
          case 'seasonally':
            nextDate.setDate(nextDate.getDate() + 90);
            break;
          case 'yearly':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
          default:
            nextDate.setMonth(nextDate.getMonth() + 1);
        }
        
        newDueDate = nextDate.toISOString().split('T')[0];
      }

      // Update reminder's due_date (or disable if frequency is 'once')
      if (reminder.frequency === 'once') {
        const { error: updateError } = await supabase
          .from('reminders')
          .update({ enabled: false })
          .eq('id', reminder.id);

        if (updateError) throw updateError;
      } else {
        const { error: updateError } = await supabase
          .from('reminders')
          .update({ due_date: newDueDate })
          .eq('id', reminder.id);

        if (updateError) throw updateError;
      }

      // Update adulting progress for assigned family members
      if (reminder.assignees && reminder.assignees.length > 0) {
        for (const assigneeId of reminder.assignees) {
          // Get current progress first
          const { data: currentMember, error: fetchError } = await supabase
            .from('family_members')
            .select('adulting_progress')
            .eq('id', assigneeId)
            .single();

          if (fetchError) {
            console.error('Error fetching current progress:', fetchError);
            continue;
          }

          const newProgress = (currentMember?.adulting_progress || 0) + 1;

          const { error: progressError } = await supabase
            .from('family_members')
            .update({ 
              adulting_progress: newProgress,
              updated_at: new Date().toISOString()
            })
            .eq('id', assigneeId);

          if (progressError) {
            console.error('Error updating adulting progress:', progressError);
          }
        }
      }

      // Clean up old completed tasks (keep only latest 3)
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
      await Promise.all([fetchReminders(), fetchCompletedTasks(), fetchFamilyMembers()]);

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
      // Convert our interface to Supabase insert format
      const reminderInsert: SupabaseReminderInsert = {
        title: reminder.title || '',
        description: reminder.description || null,
        frequency: reminder.frequency || 'monthly',
        difficulty: reminder.difficulty || null,
        estimated_time: reminder.estimated_time || null,
        estimated_budget: reminder.estimated_budget || null,
        due_date: reminder.due_date || null,
        video_url: reminder.video_url || null,
        instructions: reminder.instructions || null,
        tools: reminder.tools || null,
        supplies: reminder.supplies || null,
        enabled: reminder.enabled ?? true,
        is_custom: reminder.is_custom ?? false,
        assignees: reminder.assignees || null
      };

      const { error } = await supabase
        .from('reminders')
        .insert(reminderInsert);

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
      // Convert our interface to Supabase update format
      const reminderUpdate: SupabaseReminderUpdate = {
        title: updates.title,
        description: updates.description,
        frequency: updates.frequency,
        difficulty: updates.difficulty,
        estimated_time: updates.estimated_time,
        estimated_budget: updates.estimated_budget,
        due_date: updates.due_date,
        video_url: updates.video_url,
        instructions: updates.instructions,
        tools: updates.tools,
        supplies: updates.supplies,
        enabled: updates.enabled,
        is_custom: updates.is_custom,
        assignees: updates.assignees
      };

      const { error } = await supabase
        .from('reminders')
        .update(reminderUpdate)
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
      await Promise.all([fetchReminders(), fetchCompletedTasks(), fetchFamilyMembers()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    reminders,
    completedTasks,
    familyMembers,
    loading,
    completeTask,
    addReminder,
    updateReminder,
    deleteReminder,
    fetchReminders,
    fetchCompletedTasks,
    fetchFamilyMembers
  };
};
