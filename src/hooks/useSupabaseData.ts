import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type SupabaseReminderRow = Database['public']['Tables']['reminders']['Row'];
type SupabaseReminderInsert = Database['public']['Tables']['reminders']['Insert'];
type SupabaseReminderUpdate = Database['public']['Tables']['reminders']['Update'];
type GlobalReminderRow = Database['public']['Tables']['global_reminders']['Row'];
type UserTaskRow = Database['public']['Tables']['user_tasks']['Row'];
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
  is_global?: boolean;
  assignees: string[];
  created_at: string;
  updated_at: string;
  isPastDue?: boolean;
  assignedToNames?: string[];
}

export interface UserTask {
  id: string;
  reminder_id: string | null;
  global_reminder_id: string | null;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  estimated_budget: string;
  completed_at: string;
  completed_date: string | null;
  due_date: string | null;
  enabled: boolean;
  reminder_type: 'global' | 'custom';
  frequency: string | null;
  family_id: string | null;
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

export interface GlobalReminder {
  id: string;
  title: string;
  description: string;
  frequency: string;
  difficulty: string;
  estimated_time: string;
  estimated_budget: string;
  video_url: string | null;
  instructions: string[];
  tools: any[];
  supplies: any[];
  created_at: string;
  updated_at: string;
}

// Helper functions to convert database rows to our interfaces
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

const convertGlobalReminderRow = (row: GlobalReminderRow): GlobalReminder => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  frequency: row.frequency,
  difficulty: row.difficulty || 'Easy',
  estimated_time: row.estimated_time || '30 min',
  estimated_budget: row.estimated_budget || '',
  video_url: row.video_url,
  instructions: row.instructions || [],
  tools: Array.isArray(row.tools) ? row.tools : [],
  supplies: Array.isArray(row.supplies) ? row.supplies : [],
  created_at: row.created_at,
  updated_at: row.updated_at
});

const convertUserTaskRow = (row: UserTaskRow): UserTask => ({
  id: row.id,
  reminder_id: row.reminder_id,
  global_reminder_id: row.global_reminder_id,
  title: row.title,
  description: row.description || '',
  difficulty: row.difficulty || 'Easy',
  estimated_time: row.estimated_time || '30 min',
  estimated_budget: row.estimated_budget || '',
  completed_at: row.completed_at,
  completed_date: row.completed_date,
  due_date: row.due_date,
  enabled: row.enabled || true,
  reminder_type: (row.reminder_type as 'global' | 'custom') || 'custom',
  frequency: row.frequency,
  family_id: row.family_id,
  created_at: row.created_at
});

const convertGlobalReminderToReminder = (row: GlobalReminderRow, userTask?: UserTaskRow): SupabaseReminder => ({
  id: userTask?.id || row.id,
  title: row.title,
  description: row.description || '',
  frequency: row.frequency,
  difficulty: row.difficulty || 'Easy',
  estimated_time: row.estimated_time || '30 min',
  estimated_budget: row.estimated_budget || '',
  due_date: userTask?.due_date || null,
  video_url: row.video_url,
  instructions: row.instructions || [],
  tools: Array.isArray(row.tools) ? row.tools : [],
  supplies: Array.isArray(row.supplies) ? row.supplies : [],
  enabled: userTask?.enabled ?? false,
  is_custom: false,
  is_global: true,
  assignees: [],
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
  const [globalReminders, setGlobalReminders] = useState<GlobalReminder[]>([]);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Get current user's family_id
  const getCurrentFamilyId = async () => {
    if (!user) return null;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('family_id')
      .eq('id', user.id)
      .single();
    
    if (error) {
      console.error('Error fetching family_id:', error);
      return null;
    }
    
    return data.family_id;
  };

  const fetchFamilyMembers = async () => {
    try {
      const familyId = await getCurrentFamilyId();
      if (!familyId) return [];

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

  const fetchGlobalReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('global_reminders')
        .select('*')
        .order('title', { ascending: true });

      if (error) throw error;
      const convertedReminders = (data || []).map(convertGlobalReminderRow);
      setGlobalReminders(convertedReminders);
      return convertedReminders;
    } catch (error) {
      console.error('Error fetching global reminders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch global reminders",
        variant: "destructive"
      });
      return [];
    }
  };

  const fetchUserTasks = async () => {
    try {
      if (!user) return;
      
      const familyId = await getCurrentFamilyId();
      if (!familyId) return;
      
      const { data, error } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('family_id', familyId)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      const convertedTasks = (data || []).map(convertUserTaskRow);
      setUserTasks(convertedTasks);
      return convertedTasks;
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch user tasks",
        variant: "destructive"
      });
      return [];
    }
  };

  const fetchReminders = async () => {
    try {
      if (!user) return;
      
      const familyId = await getCurrentFamilyId();
      if (!familyId) {
        console.log('No family_id found for user');
        return;
      }

      // Fetch custom family reminders
      const { data: customReminders, error: customError } = await supabase
        .from('reminders')
        .select('*')
        .eq('family_id', familyId)
        .eq('enabled', true)
        .order('due_date', { ascending: true, nullsFirst: true });

      if (customError) throw customError;

      // Fetch global reminders and user tasks
      const [globalRems, tasks] = await Promise.all([
        fetchGlobalReminders(),
        fetchUserTasks()
      ]);

      // Combine custom reminders and enabled global reminders
      const convertedCustomReminders = (customReminders || []).map(convertSupabaseRowToReminder);
      
      const enabledGlobalReminders = globalRems
        .map(globalRem => {
          const userTask = tasks.find(task => 
            task.global_reminder_id === globalRem.id && task.enabled
          );
          return convertGlobalReminderToReminder(globalRem, userTask);
        })
        .filter(rem => rem.enabled);

      const allReminders = [...convertedCustomReminders, ...enabledGlobalReminders];
      
      // Get family members for assignment names
      const members = await fetchFamilyMembers();
      
      // Add past due flags and assignment names
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const enrichedReminders = allReminders.map(reminder => {
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

  const enableGlobalReminder = async (globalReminderId: string, dueDate?: string) => {
    try {
      if (!user) return;
      
      const familyId = await getCurrentFamilyId();
      if (!familyId) return;
      
      const globalReminder = globalReminders.find(gr => gr.id === globalReminderId);
      if (!globalReminder) return;

      const { error } = await supabase
        .from('user_tasks')
        .insert({
          global_reminder_id: globalReminderId,
          title: globalReminder.title,
          description: globalReminder.description,
          difficulty: globalReminder.difficulty,
          estimated_time: globalReminder.estimated_time,
          estimated_budget: globalReminder.estimated_budget,
          reminder_type: 'global',
          enabled: true,
          due_date: dueDate || null,
          frequency: globalReminder.frequency,
          family_id: familyId
        });

      if (error) throw error;
      await fetchReminders();
    } catch (error) {
      console.error('Error enabling global reminder:', error);
      toast({
        title: "Error",
        description: "Failed to enable reminder",
        variant: "destructive"
      });
    }
  };

  const completeTask = async (reminder: SupabaseReminder) => {
    try {
      if (!user) return;
      
      const familyId = await getCurrentFamilyId();
      if (!familyId) return;
      
      const today = new Date();
      const completedDate = today.toISOString().split('T')[0];
      
      if (reminder.is_global) {
        // Update existing user task for global reminder
        const userTask = userTasks.find(task => 
          task.global_reminder_id && globalReminders.find(gr => gr.id === task.global_reminder_id)?.title === reminder.title
        );
        
        if (userTask) {
          // Calculate new due date
          let newDueDate: string | null = null;
          if (userTask.frequency && userTask.frequency !== 'once') {
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

          // Update the user task with new due date and completion info
          const { error: updateError } = await supabase
            .from('user_tasks')
            .update({
              completed_at: new Date().toISOString(),
              completed_date: completedDate,
              due_date: newDueDate,
              enabled: userTask.frequency !== 'once'
            })
            .eq('id', userTask.id);

          if (updateError) throw updateError;
        }
      } else {
        // Handle custom reminder completion (existing logic)
        const { error: insertError } = await supabase
          .from('user_tasks')
          .insert({
            reminder_id: reminder.id,
            title: reminder.title,
            description: reminder.description,
            difficulty: reminder.difficulty,
            estimated_time: reminder.estimated_time,
            estimated_budget: reminder.estimated_budget,
            completed_date: completedDate,
            reminder_type: 'custom',
            family_id: familyId
          });

        if (insertError) throw insertError;

        // Update custom reminder due date or disable
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
      }

      // Update family member progress
      if (reminder.assignees && reminder.assignees.length > 0) {
        for (const assigneeId of reminder.assignees) {
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

      // Refresh data
      await Promise.all([fetchReminders(), fetchUserTasks(), fetchFamilyMembers()]);

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
      if (!user) return;
      
      const familyId = await getCurrentFamilyId();
      if (!familyId) return;
      
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
        is_custom: reminder.is_custom ?? true,
        assignees: reminder.assignees || null,
        family_id: familyId
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
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      await Promise.all([fetchReminders(), fetchUserTasks(), fetchFamilyMembers()]);
      setLoading(false);
    };

    loadData();
  }, [user]);

  return {
    reminders,
    globalReminders,
    userTasks,
    completedTasks: userTasks.filter(task => task.completed_at),
    familyMembers,
    loading,
    completeTask,
    addReminder,
    updateReminder,
    deleteReminder,
    enableGlobalReminder,
    fetchReminders,
    fetchUserTasks,
    fetchFamilyMembers
  };
};
