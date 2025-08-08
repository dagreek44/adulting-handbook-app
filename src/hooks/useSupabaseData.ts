import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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
  family_id?: string | null;
}

export interface UserTask {
  id: string;
  reminder_id: string;
  completed_date: string | null;
  family_id: string;
  enabled: boolean;
  due_date: string;
  frequency: string;
  frequency_days: number;
  reminder_type: string;
  created_at: string;
  // Combined with reminder data to match SupabaseReminder interface
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  estimated_budget: string;
  video_url: string | null;
  instructions: string[];
  tools: any[];
  supplies: any[];
  assignees: string[];
  is_custom: boolean;
  updated_at: string;
  isPastDue?: boolean;
  assignedToNames?: string[];
  // Add missing properties for completion tracking
  last_completed: string | null;
  next_due: string;
  status: string;
}

export interface CompletedTask {
  id: string;
  reminder_id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  estimated_budget: string;
  completed_date: string;
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
  updated_at: row.updated_at,
  family_id: row.family_id
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
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  
  // Initialize all state hooks first, unconditionally with clearer names
  const [allAvailableReminders, setAllAvailableReminders] = useState<SupabaseReminder[]>([]);
  const [enabledUserTasks, setEnabledUserTasks] = useState<UserTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletedTasks = async () => {
    if (!user?.id) {
      console.log('fetchCompletedTasks: No user ID available');
      return [];
    }
    
    try {
      console.log('fetchCompletedTasks: Fetching for user:', user.id);
      const { data, error } = await supabase
        .from('user_tasks')
        .select(`
          *,
          reminders (
            title,
            description,
            difficulty,
            estimated_time,
            estimated_budget
          )
        `)
        .eq('user_id', user.id)
        .not('completed_date', 'is', null)
        .order('completed_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const formattedCompletedTasks = (data || []).map(task => {
        const reminderData = task.reminders as any;
        return {
          id: task.id,
          reminder_id: task.reminder_id,
          title: reminderData?.title || 'Unknown Task',
          description: reminderData?.description || '',
          difficulty: reminderData?.difficulty || 'Easy',
          estimated_time: reminderData?.estimated_time || '30 min',
          estimated_budget: reminderData?.estimated_budget || '',
          completed_date: task.completed_date || '',
          created_at: task.created_at
        };
      });
      
      console.log('fetchCompletedTasks: Found', formattedCompletedTasks.length, 'completed tasks');
      setCompletedTasks(formattedCompletedTasks);
      return formattedCompletedTasks;
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      toast({
        title: "Error",
        description: "Failed to fetch completed tasks",
        variant: "destructive"
      });
      return [];
    }
  };

  const fetchFamilyMembers = async () => {
    const familyId = userProfile?.family_id;
    
    if (!familyId) {
      console.log('fetchFamilyMembers: No family_id available, userProfile:', !!userProfile);
      setFamilyMembers([]);
      return [];
    }
    
    try {
      console.log('fetchFamilyMembers: Fetching for family:', familyId);
      const { data, error } = await supabase
        .from('users')
        .select('id, first_name, last_name, email, username, family_id, created_at, updated_at')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const convertedMembers = (data || []).map((member, index) => ({
        id: member.id,
        name: `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.username || member.email || 'Unknown',
        email: member.email,
        role: (index === 0 ? 'Admin' : 'Member') as 'Admin' | 'Member', // First member is admin
        adulting_progress: 0,
        invited_at: member.created_at,
        created_at: member.created_at,
        updated_at: member.updated_at
      }));
      
      console.log('fetchFamilyMembers: Found', convertedMembers.length, 'family members');
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

  const fetchAllReminders = async () => {
    const familyId = userProfile?.family_id;
    
    if (!familyId) {
      console.log('fetchAllReminders: No family_id available, userProfile:', !!userProfile);
      
      // Try to fetch global reminders only when no family_id is available
      try {
        console.log('fetchAllReminders: Fetching global reminders only');
        const { data, error } = await supabase
          .from('reminders')
          .select('*')
          .eq('is_custom', false)
          .order('created_at', { ascending: true });

        if (error) throw error;
        
        const convertedReminders = (data || []).map(convertSupabaseRowToReminder);
        console.log('fetchAllReminders: Found', convertedReminders.length, 'global reminders');
        setAllAvailableReminders(convertedReminders);
        return convertedReminders;
      } catch (error) {
        console.error('Error fetching global reminders:', error);
        return [];
      }
    }
    
    try {
      console.log('fetchAllReminders: Fetching for family:', familyId);
      
      // Get global reminders (is_custom = false) OR family-specific reminders
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .or(`is_custom.eq.false,and(is_custom.eq.true,family_id.eq.${familyId})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const convertedReminders = (data || []).map(convertSupabaseRowToReminder);
      console.log('fetchAllReminders: Found', convertedReminders.length, 'total reminders');
      
      // Get existing user tasks to mark which reminders are enabled
      const { data: userTasksData, error: userTasksError } = await supabase
        .from('user_tasks')
        .select('reminder_id, enabled')
        .eq('user_id', user?.id);

      if (userTasksError) {
        console.error('Error fetching user tasks for enabled status:', userTasksError);
      }

      const enabledReminderIds = new Set(
        (userTasksData || [])
          .filter(task => task.enabled)
          .map(task => task.reminder_id)
      );

      const enrichedReminders = convertedReminders.map(reminder => ({
        ...reminder,
        enabled: enabledReminderIds.has(reminder.id)
      }));
      
      console.log('fetchAllReminders: Enriched with enabled status, found', enabledReminderIds.size, 'enabled');
      setAllAvailableReminders(enrichedReminders);
      return enrichedReminders;
    } catch (error) {
      console.error('Error fetching all reminders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reminders",
        variant: "destructive"
      });
      return [];
    }
  };

  const fetchUserTasks = async () => {
    if (!user?.id) {
      console.log('fetchUserTasks: No user ID available');
      return [];
    }
    
    try {
      console.log('fetchUserTasks: Fetching enabled tasks for user:', user.id);
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
            updated_at,
            frequency
          )
        `)
        .eq('user_id', user.id)
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

        // Calculate frequency_days from frequency string
        const getFrequencyDays = (frequency: string) => {
          switch (frequency) {
            case 'weekly': return 7;
            case 'monthly': return 30;
            case 'quarterly': return 90;
            case 'seasonally': return 90;
            case 'yearly': return 365;
            default: return 30;
          }
        };

        // Calculate next_due date if not already set
        const calculateNextDue = () => {
          if (task.completed_date) {
            const completedDate = new Date(task.completed_date);
            const frequencyDays = getFrequencyDays(task.frequency);
            const nextDue = new Date(completedDate.getTime() + frequencyDays * 24 * 60 * 60 * 1000);
            return nextDue.toISOString().split('T')[0];
          }
          return task.due_date;
        };
        
        return {
          id: task.id,
          reminder_id: task.reminder_id,
          completed_date: task.completed_date,
          family_id: userProfile?.family_id || '',
          enabled: task.enabled,
          due_date: task.due_date,
          frequency: task.frequency,
          frequency_days: getFrequencyDays(task.frequency),
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
          assignedToNames,
          last_completed: task.completed_date,
          next_due: calculateNextDue(),
          status: task.completed_date ? 'completed' : 'pending'
        };
      });
      
      console.log('fetchUserTasks: Found', enrichedTasks.length, 'enabled user tasks');
      setEnabledUserTasks(enrichedTasks);
      return enrichedTasks;
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

  const toggleReminderEnabled = async (reminderId: string, enabled: boolean) => {
    if (!user?.id) {
      console.log('toggleReminderEnabled: No user ID available');
      return;
    }
    
    try {
      console.log('toggleReminderEnabled: Toggling reminder', reminderId, 'enabled:', enabled, 'for user:', user.id);
      
      if (enabled) {
        // Get reminder details to create user task
        const { data: reminderData, error: reminderError } = await supabase
          .from('reminders')
          .select('*')
          .eq('id', reminderId)
          .single();

        if (reminderError) {
          console.error('toggleReminderEnabled: Error fetching reminder:', reminderError);
          throw reminderError;
        }

        console.log('toggleReminderEnabled: Found reminder data:', reminderData);

        // Check if user task already exists
        const { data: existingTask, error: existingTaskError } = await supabase
          .from('user_tasks')
          .select('id, enabled')
          .eq('reminder_id', reminderId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingTaskError) {
          console.error('toggleReminderEnabled: Error checking existing task:', existingTaskError);
          throw existingTaskError;
        }

        if (existingTask) {
          console.log('toggleReminderEnabled: Updating existing task to enabled');
          // Update existing task to enabled
          const { error: updateError } = await supabase
            .from('user_tasks')
            .update({ enabled: true })
            .eq('id', existingTask.id);

          if (updateError) {
            console.error('toggleReminderEnabled: Error updating existing task:', updateError);
            throw updateError;
          }
        } else {
          console.log('toggleReminderEnabled: Creating new user task');
          // Create new user task with proper due date calculation
          const dueDate = reminderData.due_date || new Date().toISOString().split('T')[0];
          
          const { error: insertError } = await supabase
            .from('user_tasks')
            .insert({
              reminder_id: reminderId,
              user_id: user.id,
              due_date: dueDate,
              frequency: reminderData.frequency,
              reminder_type: reminderData.is_custom ? 'custom' : 'global',
              enabled: true
            });

          if (insertError) {
            console.error('toggleReminderEnabled: Error creating new task:', insertError);
            throw insertError;
          }
          
          console.log('toggleReminderEnabled: Successfully created new user task');
        }
      } else {
        console.log('toggleReminderEnabled: Disabling user task');
        // Disable the user task
        const { error: updateError } = await supabase
          .from('user_tasks')
          .update({ enabled: false })
          .eq('reminder_id', reminderId)
          .eq('user_id', user.id);

        if (updateError) {
          console.error('toggleReminderEnabled: Error disabling task:', updateError);
          throw updateError;
        }
      }

      // Refresh data to show changes immediately
      console.log('toggleReminderEnabled: Refreshing data after toggle');
      await Promise.all([fetchAllReminders(), fetchUserTasks()]);

      toast({
        title: enabled ? "Reminder enabled" : "Reminder disabled",
        description: enabled ? "Task has been added to your list" : "Task has been removed from your list",
      });
    } catch (error) {
      console.error('toggleReminderEnabled: Error toggling reminder:', error);
      toast({
        title: "Error",
        description: "Failed to update reminder",
        variant: "destructive"
      });
    }
  };

  const completeTask = async (userTask: UserTask) => {
    try {
      const today = new Date();
      const completedDate = today.toISOString().split('T')[0];
      
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
    if (!userProfile?.family_id) return;
    
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
        is_custom: reminder.is_custom ?? true,
        assignees: reminder.assignees || null,
        family_id: userProfile.family_id
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
            user_id: user?.id,
            due_date: newReminder.due_date || new Date().toISOString().split('T')[0],
            frequency: newReminder.frequency,
            reminder_type: newReminder.is_custom ? 'custom' : 'global'
          });

        if (taskError) throw taskError;
      }

      await Promise.all([fetchAllReminders(), fetchUserTasks()]);
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
      await Promise.all([fetchAllReminders(), fetchUserTasks()]);
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
      await Promise.all([fetchAllReminders(), fetchUserTasks()]);
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast({
        title: "Error",
        description: "Failed to delete reminder",
        variant: "destructive"
      });
    }
  };

  // Only run effects when we have both user and userProfile
  useEffect(() => {
    const loadData = async () => {
      console.log('loadData: Starting, user:', !!user, 'userProfile:', !!userProfile);
      
      if (!user) {
        console.log('loadData: No user available, skipping data load');
        setLoading(false);
        return;
      }
      
      // Always try to load some data even if userProfile is missing
      console.log('loadData: Starting data load for user:', user.id);
      setLoading(true);
      
      try {
        // Always try to fetch global reminders and user tasks
        await Promise.all([
          fetchAllReminders(),
          fetchUserTasks(),
          fetchCompletedTasks()
        ]);
        
        // Always try to fetch family members
        await fetchFamilyMembers();
      } catch (error) {
        console.error('loadData: Error during data loading:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, userProfile?.family_id]); // Depend on family_id specifically to avoid unnecessary reloads

  // Return the correct mapping: user's active tasks as 'reminders', all available as 'allReminders'
  return {
    reminders: enabledUserTasks, // User's active tasks for main list
    allReminders: allAvailableReminders, // Complete list for edit mode
    completedTasks,
    familyMembers,
    loading,
    completeTask,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderEnabled,
    fetchReminders: fetchUserTasks,
    fetchAllReminders,
    fetchCompletedTasks,
    fetchFamilyMembers
  };
};
