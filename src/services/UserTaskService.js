
import { supabase } from '../integrations/supabase/client';
import { ReminderService } from './ReminderService';

export class UserTaskService {
  // Get all tasks for a specific user
  static async getUserTasks(userId) {
    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (error) throw error;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const results = (data || []).map(row => {
        const isPastDue = new Date(row.due_date) < today;
        
        return {
          ...row,
          instructions: row.instructions || [],
          tools: row.tools || [],
          supplies: row.supplies || [],
          isPastDue,
          assignees: ['Family'],
          assignedToNames: ['Family']
        };
      });
      
      return results;
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      return [];
    }
  }

  // Get completed tasks for a specific user
  static async getCompletedTasks(userId) {
    try {
      const { data, error } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('user_id', userId)
        .not('last_completed', 'is', null)
        .order('last_completed', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      const results = (data || []).map(row => ({
        id: row.id,
        title: row.title,
        description: row.description || '',
        difficulty: row.difficulty || 'Easy',
        estimated_time: row.estimated_time || '30 min',
        estimated_budget: row.estimated_budget || '',
        completed_date: row.last_completed,
        created_at: row.created_at
      }));
      
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
          frequency_days: task.frequency_days || 30,
          due_date: dueDate,
          difficulty: task.difficulty || 'Easy',
          estimated_time: task.estimated_time || '30 min',
          estimated_budget: task.estimated_budget || '',
          video_url: task.video_url || null,
          instructions: task.instructions || [],
          tools: task.tools || [],
          supplies: task.supplies || [],
          is_custom: true,
          reminder_type: 'custom'
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
      // Check if task already exists for this user
      const { data: existingTask, error: checkError } = await supabase
        .from('user_tasks')
        .select('id')
        .eq('reminder_id', reminderId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) throw checkError;
      
      if (existingTask) {
        console.log('Task already exists for user');
        return null;
      }

      // Get the global reminder
      const reminder = await ReminderService.getReminderById(reminderId);
      if (!reminder) {
        throw new Error('Reminder not found');
      }

      // Create user task from global reminder
      const dueDate = this.calculateDueDate(reminder.frequency_days);

      const { data, error } = await supabase
        .from('user_tasks')
        .insert([{
          user_id: userId,
          reminder_id: reminderId,
          title: reminder.title,
          description: reminder.description,
          frequency_days: reminder.frequency_days,
          due_date: dueDate,
          difficulty: reminder.difficulty,
          estimated_time: reminder.estimated_time,
          estimated_budget: reminder.estimated_budget,
          video_url: reminder.video_url,
          instructions: reminder.instructions,
          tools: reminder.tools,
          supplies: reminder.supplies,
          is_custom: false,
          reminder_type: 'global'
        }])
        .select()
        .single();

      if (error) throw error;
      
      return data.id;
    } catch (error) {
      console.error('Error enabling reminder for user:', error);
      throw error;
    }
  }

  // Mark a task as completed
  static async completeTask(taskId) {
    try {
      // Get current task details
      const { data: task, error: getError } = await supabase
        .from('user_tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (getError) throw getError;
      if (!task) throw new Error('Task not found');
      
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate next due date based on frequency
      let nextDueDate = null;
      if (task.frequency_days > 0) {
        nextDueDate = this.calculateNextDueDate(today, task.frequency_days);
      }
      
      // Update task with completion
      const updateData = {
        last_completed: today,
        status: 'completed'
      };
      
      // Only set next due date if it's a recurring task
      if (nextDueDate) {
        updateData.due_date = nextDueDate;
        updateData.status = 'pending'; // Reset to pending for recurring tasks
      }
      
      const { error: updateError } = await supabase
        .from('user_tasks')
        .update(updateData)
        .eq('id', taskId);
      
      if (updateError) throw updateError;
      
      return true;
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
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
}
