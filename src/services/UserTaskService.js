import { supabase } from '../integrations/supabase/client';
import { ReminderService } from './ReminderService';

export class UserTaskService {
  // Get all family tasks (not just for specific user)
  static async getUserTasks(userId) {
    try {
      // Step 1: Get the user's family_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      if (!userData?.family_id) {
        console.log('getUserTasks: No family_id found for user');
        return [];
      }
      
      console.log('getUserTasks: Fetching tasks for family:', userData.family_id);
      
      // Fetch tasks for the entire family using family_id
      const { data, error } = await supabase
        .from('user_tasks')
        .select(`
          *,
          reminder:reminders(
            title,
            description,
            difficulty,
            estimated_time,
            estimated_budget,
            video_url,
            instructions,
            tools,
            supplies
          ),
          assignee:users!user_tasks_user_id_fkey(
            id,
            first_name,
            last_name,
            username
          )
        `)
        .eq('family_id', userData.family_id)
        .eq('enabled', true)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const results = (data || []).map(row => {
        const isPastDue = new Date(row.due_date) < today;
        
        // Use data from global reminder if it exists, otherwise use task data
        const reminderData = row.reminder?.[0];
        const assigneeData = row.assignee;
        const assigneeName = assigneeData 
          ? `${assigneeData.first_name} ${assigneeData.last_name}`.trim() 
          : 'Unassigned';
        const assigneeUsername = assigneeData?.username || 'Unassigned';
        
        return {
          ...row,
          // Prioritize global reminder data for consistency
          title: reminderData?.title || row.title,
          description: reminderData?.description || row.description,
          difficulty: reminderData?.difficulty || row.difficulty,
          estimated_time: reminderData?.estimated_time || row.estimated_time,
          estimated_budget: reminderData?.estimated_budget || row.estimated_budget,
          video_url: reminderData?.video_url || row.video_url,
          instructions: reminderData?.instructions || row.instructions || [],
          tools: reminderData?.tools || row.tools || [],
          supplies: reminderData?.supplies || row.supplies || [],
          isPastDue,
          assignees: [assigneeName],
          assignedToNames: [assigneeName],
          assigneeUsername,
          isGlobalReminder: !!row.reminder_id // Mark as global reminder if it has a reminder_id
        };
      });
      
      return results;
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      return [];
    }
  }

  // Get completed tasks for the family (all family members)
  static async getCompletedTasks(userId) {
    try {
      // First get the user's family_id
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', userId)
        .single();
      
      if (userError) throw userError;
      if (!userData?.family_id) {
        console.log('getCompletedTasks: No family_id found for user');
        return [];
      }

      // Get all completed tasks for the family (including disabled "once" tasks)
      const { data, error } = await supabase
        .from('user_tasks')
        .select(`
          *,
          assignee:users!user_tasks_user_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq('family_id', userData.family_id)
        .not('last_completed', 'is', null)
        .order('last_completed', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Get completed_by user info for each task
      const completedByIds = [...new Set((data || []).map(row => row.completed_by).filter(Boolean))];
      let completedByUsers = {};
      
      if (completedByIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', completedByIds);
        
        if (usersData) {
          completedByUsers = usersData.reduce((acc, user) => {
            acc[user.id] = `${user.first_name} ${user.last_name}`.trim();
            return acc;
          }, {});
        }
      }
      
      const results = (data || []).map(row => {
        const assigneeData = row.assignee;
        const assigneeName = assigneeData 
          ? `${assigneeData.first_name} ${assigneeData.last_name}`.trim() 
          : 'Unassigned';
        const completedByName = row.completed_by ? completedByUsers[row.completed_by] : null;
        
        return {
          id: row.id,
          title: row.title,
          description: row.description || '',
          difficulty: row.difficulty || 'Easy',
          estimated_time: row.estimated_time || '30 min',
          estimated_budget: row.estimated_budget || '',
          completed_date: row.last_completed,
          created_at: row.created_at,
          assignee_name: assigneeName,
          completed_by: row.completed_by,
          completed_by_name: completedByName || assigneeName
        };
      });
      
      return results;
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      return [];
    }
  }

  // Add a custom user task
  static async addUserTask(userId, task) {
    try {
      const dueDate = this.calculateDueDate(task.frequency_days || 30);
      
      const { data, error } = await supabase
        .from('user_tasks')
        .insert([{
          user_id: userId,
          title: task.title,
          description: task.description || '',
          frequency_days: task.frequency_days === 0 ? 0 : (task.frequency_days || 30),
          frequency: task.frequency_days === 0 ? 'once' : this.getFrequencyString(task.frequency_days || 30),
          due_date: dueDate,
          difficulty: task.difficulty || 'Easy',
          estimated_time: task.estimated_time || '30 min',
          estimated_budget: task.estimated_budget || '',
          video_url: task.video_url || null,
          instructions: task.instructions || [],
          tools: task.tools || [],
          supplies: task.supplies || [],
          is_custom: true,
          reminder_type: 'custom',
          enabled: true,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('Error adding user task:', error);
      throw error;
    }
  }

  // Enable a global reminder for a user
  static async enableReminderForUser(reminderId, userId) {
    try {
      console.log('UserTaskService: Starting enableReminderForUser', { reminderId, userId });
      
      // Check if user exists in users table first
      console.log('UserTaskService: Checking if user exists in users table');
      const { data: userExists, error: userCheckError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (userCheckError) {
        console.error('UserTaskService: Error checking user existence:', userCheckError);
        throw userCheckError;
      }

      if (!userExists) {
        console.log('UserTaskService: User not found in users table, attempting to create from profile');
        
        // Try to get user data from profiles table and create in users table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profileError) {
          console.error('UserTaskService: Error fetching profile:', profileError);
          throw profileError;
        }

        if (!profileData) {
          console.error('UserTaskService: User not found in profiles table either:', userId);
          throw new Error(`User ${userId} not found. Please set up your profile first.`);
        }

        // Create user in users table from profile data
        const { error: createUserError } = await supabase
          .from('users')
          .insert([{
            id: userId,
            email: profileData["Email Address"] || 'no-email@example.com',
            first_name: profileData.first_name,
            last_name: profileData.last_name,
            username: profileData.username,
            family_id: profileData.family_id,
            password_hash: 'authenticated_via_supabase_auth'
          }]);

        if (createUserError) {
          console.error('UserTaskService: Error creating user:', createUserError);
          throw createUserError;
        }

        console.log('UserTaskService: Successfully created user from profile data');
      }

      console.log('UserTaskService: User exists, proceeding with reminder enable');
      
      // Check if task already exists for this user
      const { data: existingTask, error: checkError } = await supabase
        .from('user_tasks')
        .select('id, enabled')
        .eq('reminder_id', reminderId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('UserTaskService: Error checking existing task:', checkError);
        throw checkError;
      }
      
      if (existingTask) {
        console.log('UserTaskService: Task already exists, updating to enabled');
        // If task exists but is disabled, re-enable it
        if (!existingTask.enabled) {
          const { error: updateError } = await supabase
            .from('user_tasks')
            .update({ enabled: true })
            .eq('id', existingTask.id);
          
          if (updateError) throw updateError;
        }
        return existingTask.id;
      }

      // Get the global reminder details
      console.log('UserTaskService: Fetching reminder details for', reminderId);
      const reminder = await ReminderService.getReminderById(reminderId);
      if (!reminder) {
        throw new Error('Reminder not found');
      }

      console.log('UserTaskService: Found reminder:', reminder.title);

      // Create user task from global reminder
      const dueDate = this.calculateDueDate(reminder.frequency_days || 30);
      console.log('UserTaskService: Calculated due date:', dueDate);

      const taskData = {
        user_id: userId,
        reminder_id: reminderId,
        title: reminder.title,
        description: reminder.description || '',
        frequency_days: reminder.frequency_days || 30,
        frequency: reminder.frequency || this.getFrequencyString(reminder.frequency_days || 30),
        due_date: dueDate,
        difficulty: reminder.difficulty || 'Easy',
        estimated_time: reminder.estimated_time || '30 min',
        estimated_budget: reminder.estimated_budget || '',
        video_url: reminder.video_url || null,
        instructions: reminder.instructions || [],
        tools: reminder.tools || [],
        supplies: reminder.supplies || [],
        is_custom: false,
        reminder_type: 'global',
        enabled: true,
        status: 'pending'
      };

      console.log('UserTaskService: Inserting task data:', taskData);

      const { data, error } = await supabase
        .from('user_tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('UserTaskService: Error inserting task:', error);
        throw error;
      }
      
      console.log('UserTaskService: Successfully created task:', data.id);
      return data.id;
    } catch (error) {
      console.error('UserTaskService: Error in enableReminderForUser:', error);
      throw error;
    }
  }

  // Mark a task as completed
  static async completeTask(taskId) {
    try {
      // Get current task details and current user info
      const { data: task, error: getError } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (getError) throw getError;
      if (!task) throw new Error('Task not found');
      
      // Get current user's data
      const { data: { user } } = await supabase.auth.getUser();
      const { data: userData } = await supabase
        .from('users')
        .select('id, username, first_name, last_name, family_id')
        .eq('id', user?.id)
        .single();
      
      const today = new Date().toISOString().split('T')[0];
      const completedByName = userData ? `${userData.first_name} ${userData.last_name}`.trim() : 'Someone';
      
      // Handle completion based on frequency
      const updateData = {
        last_completed: today,
        completed_date: today,
        completed_by: user?.id, // Store the user_id, not username
        status: 'completed'
      };
      
      // Check if this is a "once" frequency task
      if (task.frequency === 'once' || task.frequency_days === 0) {
        // For "once" tasks, disable them and clear due_date
        updateData.enabled = false;
        updateData.due_date = null;
      } else {
        // For recurring tasks, calculate next due date based on frequency
        let nextDueDate = this.calculateNextDueDateFromFrequency(today, task.frequency, task.frequency_days);
        
        if (nextDueDate) {
          updateData.due_date = nextDueDate;
          updateData.status = 'pending'; // Reset to pending for recurring tasks
        }
      }
      
      const { error: updateError } = await supabase
        .from('user_tasks')
        .update(updateData)
        .eq('id', taskId);
      
      if (updateError) throw updateError;
      
      // Notify family members about task completion
      if (userData?.family_id && user?.id) {
        try {
          // Get all family members except the one who completed the task
          const { data: familyMembers } = await supabase
            .from('users')
            .select('id, first_name, last_name')
            .eq('family_id', userData.family_id)
            .neq('id', user.id);
          
          if (familyMembers && familyMembers.length > 0) {
            // Dynamically import NotificationService to avoid circular dependencies
            const { NotificationService } = await import('./NotificationService');
            
            // Send notification to each family member
            for (const member of familyMembers) {
              await NotificationService.notifyTaskCompleted(
                completedByName,
                task.title,
                taskId
              );
            }
          }
        } catch (notificationError) {
          console.error('Error sending completion notifications:', notificationError);
          // Don't fail the completion if notifications fail
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }

  // Calculate next due date based on frequency string
  static calculateNextDueDateFromFrequency(completedDate, frequency, frequencyDays) {
    const completed = new Date(completedDate);
    let daysToAdd = frequencyDays || 30;
    
    // Use frequency string to determine days if frequency_days not reliable
    switch (frequency?.toLowerCase()) {
      case 'weekly':
        daysToAdd = 7;
        break;
      case 'monthly':
        daysToAdd = 30;
        break;
      case 'quarterly':
        daysToAdd = 90;
        break;
      case 'seasonally':
        daysToAdd = 90;
        break;
      case 'yearly':
        daysToAdd = 365;
        break;
      case 'once':
        return null; // No next due date for once tasks
      default:
        // Fall back to frequency_days if provided
        daysToAdd = frequencyDays > 0 ? frequencyDays : 30;
    }
    
    const nextDue = new Date(completed.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return nextDue.toISOString().split('T')[0];
  }

  // Delete a user task
  static async deleteUserTask(taskId) {
    try {
      const { error } = await supabase
        .from('user_tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error deleting user task:', error);
      throw error;
    }
  }

  // Update a user task
  static async updateUserTask(taskId, updates) {
    try {
      const { error } = await supabase
        .from('user_tasks')
        .update(updates)
        .eq('id', taskId);
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error updating user task:', error);
      throw error;
    }
  }

  // Helper method to calculate due date
  static calculateDueDate(frequencyDays) {
    const today = new Date();
    const dueDate = new Date(today.getTime() + frequencyDays * 24 * 60 * 60 * 1000);
    return dueDate.toISOString().split('T')[0];
  }

  // Helper method to calculate next due date after completion
  static calculateNextDueDate(lastCompleted, frequencyDays) {
    const completedDate = new Date(lastCompleted);
    const nextDue = new Date(completedDate.getTime() + frequencyDays * 24 * 60 * 60 * 1000);
    return nextDue.toISOString().split('T')[0];
  }

  // Helper method to convert frequency days to string
  static getFrequencyString(days) {
    if (days === 0) return 'once'; // Handle "once" frequency
    if (days <= 7) return 'weekly';
    if (days <= 30) return 'monthly';
    if (days <= 90) return 'quarterly';
    if (days <= 180) return 'seasonally';
    return 'yearly';
  }
}
