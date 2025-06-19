
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type SupabaseReminderRow = Database['public']['Tables']['reminders']['Row'];
type SupabaseReminderInsert = Database['public']['Tables']['reminders']['Insert'];
type SupabaseReminderUpdate = Database['public']['Tables']['reminders']['Update'];
type FamilyMemberRow = Database['public']['Tables']['family_members']['Row'];
type UserTaskRow = Database['public']['Tables']['user_tasks']['Row'];

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

export interface UserTask {
  id: string;
  reminder_id: string;
  completed_date: string | null;
  family_id: string;
  enabled: boolean;
  due_date: string;
  frequency: string;
  reminder_type: string;
  created_at: string;
  // Combined with reminder data
  title?: string;
  description?: string;
  difficulty?: string;
  estimated_time?: string;
  estimated_budget?: string;
  video_url?: string | null;
  instructions?: string[];
  tools?: any[];
  supplies?: any[];
  assignees?: string[];
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
  instructions: Array.isArray(row.instructions) ? row.instructions : [],
  tools: Array.isArray(row.tools) ? row.tools : [],
  supplies: Array.isArray(row.supplies) ? row.supplies : [],
  enabled: row.enabled || true,
  is_custom: row.is_custom || false,
  assignees: Array.isArray(row.assignees) ? row.assignees : [],
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
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
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

  const fetchUserTasks = async () => {
    try {
      // Fetch user tasks with reminder data
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
            assignees
          )
        `)
        .eq('enabled', true)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      const members = await fetchFamilyMembers();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const enrichedTasks = (data || []).map(task => {
        const reminderData = task.reminders as any;
        const isPastDue = new Date(task.due_date) < today;
        
        let assignedToNames: string[] = [];
        if (reminderData?.assignees && reminderData.assignees.length > 0) {
          assignedToNames = reminderData.assignees
            .map((assigneeId: string) => members.find(m => m.id === assigneeId)?.name)
            .filter(Boolean) as string[];
        }
        
        if (assignedToNames.length === 0) {
          assignedToNames = ['Family'];
        }
        
        return {
          id: task.id,
          reminder_id: task.reminder_id,
          completed_date: task.completed_date,
          family_id: task.family_id,
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
          isPastDue,
          assignedToNames
        };
      });
      
      setUserTasks(enrichedTasks);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user tasks",
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

  const completeTask = async (userTask: UserTask) => {
    try {
      const today = new Date();
      const completedDate = today.toISOString().split('T')[0];
      
      // Add to completed tasks
      const { error: insertError } = await supabase
        .from('completed_tasks')
        .insert({
          reminder_id: userTask.reminder_id,
          title: userTask.title || 'Unknown Task',
          description: userTask.description || '',
          difficulty: userTask.difficulty || 'Easy',
          estimated_time: userTask.estimated_time || '30 min',
          estimated_budget: userTask.estimated_budget || '',
          completed_date: completedDate
        });

      if (insertError) throw insertError;

      // Calculate new due date based on frequency
      let newDueDate: string | null = null;
      if (userTask.frequency !== 'once') {
        const nextDate = new Date(today);
        
        switch (userTask.frequency) {
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

      // Update user task
      if (userTask.frequency === 'once') {
        // Disable the task if it's a one-time task
        const { error: updateError } = await supabase
          .from('user_tasks')
          .update({ 
            enabled: false,
            completed_date: completedDate
          })
          .eq('id', userTask.id);

        if (updateError) throw updateError;
      } else {
        // Update the due date for recurring tasks
        const { error: updateError } = await supabase
          .from('user_tasks')
          .update({ 
            due_date: newDueDate!,
            completed_date: completedDate
          })
          .eq('id', userTask.id);

        if (updateError) throw updateError;
      }

      // Update adulting progress for assigned family members
      if (userTask.assignees && userTask.assignees.length > 0) {
        for (const assigneeId of userTask.assignees) {
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
      await Promise.all([fetchUserTasks(), fetchCompletedTasks(), fetchFamilyMembers()]);

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

      const { data: newReminder, error } = await supabase
        .from('reminders')
        .insert(reminderInsert)
        .select()
        .single();

      if (error) throw error;

      // Create a user task for this reminder
      if (newReminder) {
        const { error: taskError } = await supabase
          .from('user_tasks')
          .insert({
            reminder_id: newReminder.id,
            family_id: 'temp-family-id', // You'll need to get the actual family_id
            due_date: newReminder.due_date || new Date().toISOString().split('T')[0],
            frequency: newReminder.frequency,
            reminder_type: newReminder.is_custom ? 'custom' : 'global'
          });

        if (taskError) throw taskError;
      }

      await Promise.all([fetchReminders(), fetchUserTasks()]);
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
      await Promise.all([fetchReminders(), fetchUserTasks()]);
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
      await Promise.all([fetchReminders(), fetchUserTasks()]);
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
      await Promise.all([fetchReminders(), fetchUserTasks(), fetchCompletedTasks(), fetchFamilyMembers()]);
      setLoading(false);
    };

    loadData();
  }, []);

  return {
    reminders: userTasks, // Return user tasks as reminders for compatibility
    completedTasks,
    familyMembers,
    loading,
    completeTask,
    addReminder,
    updateReminder,
    deleteReminder,
    fetchReminders: fetchUserTasks,
    fetchCompletedTasks,
    fetchFamilyMembers
  };
};
