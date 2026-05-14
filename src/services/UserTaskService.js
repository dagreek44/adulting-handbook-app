import { supabase } from '../integrations/supabase/client';
import { ReminderService } from './ReminderService';

export class UserTaskService {
  /**
   * Get all family tasks (not just for specific user)
   */
  static async getUserTasks(userId) {
    try {
      console.log('UserTaskService: Fetching tasks for user', userId);

      // 1. Get the user's family_id
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) console.error('UserTaskService: User fetch error:', profileError);

      const familyId = profileData?.family_id;
      console.log('UserTaskService: User family_id is:', familyId);

      // 2. Fetch tasks. We'll join with 'reminders' and 'friend_groups'.
      // We'll fetch assignee details in a separate step to avoid RLS/Join issues with the 'users' table.
      let query = supabase
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
            supplies,
            why
          ),
          group:friend_groups(
            id,
            name
          )
        `)
        .eq('enabled', true)
        // Exclude one-time tasks that have been completed
        .or('frequency.neq.once,and(frequency.eq.once,completed_date.is.null)');

      if (familyId) {
        // Fetch tasks for the entire family AND any personal tasks
        query = query.or(`family_id.eq.${familyId},user_id.eq.${userId}`);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data: tasks, error: tasksError } = await query.order('due_date', { ascending: true });

      if (tasksError) {
        console.error('UserTaskService: Error fetching tasks:', tasksError);
        throw tasksError;
      }

      if (!tasks || tasks.length === 0) {
        console.log('UserTaskService: No tasks found in database');
        return [];
      }

      // 3. Enrich tasks with assignee names from the 'users' table
      const assigneeIds = [...new Set(tasks.map(t => t.user_id).filter(Boolean))];
      let profilesMap = {};

      if (assigneeIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, first_name, last_name, username')
          .in('id', assigneeIds);

        if (usersError) {
          console.error('UserTaskService: Error fetching users:', usersError);
        }

        if (users) {
          profilesMap = users.reduce((acc, u) => {
            acc[u.id] = u;
            return acc;
          }, {});
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const results = tasks.map(row => {
        const isPastDue = new Date(row.due_date) < today;
        const reminderData = row.reminder; // Note: select might return single object or array depending on config
        const globalReminder = Array.isArray(reminderData) ? reminderData[0] : reminderData;

        const assignee = profilesMap[row.user_id];
        const assigneeName = assignee
          ? `${assignee.first_name} ${assignee.last_name}`.trim()
          : 'Unassigned';
        
        if (!assignee && row.user_id) {
          console.warn('UserTaskService: Profile not found for user_id:', row.user_id, 'Task:', row.title);
        }
        
        const assigneeUsername = assignee?.username || (assigneeName !== 'Unassigned' ? assigneeName : 'Unassigned');

        let source = 'personal';
        let sourceGroupName = null;

        if (row.group_id && row.group) {
          source = 'friend_group';
          const groupData = Array.isArray(row.group) ? row.group[0] : row.group;
          sourceGroupName = groupData?.name;
        } else if (familyId && row.family_id === familyId) {
          source = 'family';
        }
        
        return {
          ...row,
          title: row.title || globalReminder?.title || 'Untitled Task',
          description: row.description || globalReminder?.description || '',
          difficulty: row.difficulty || globalReminder?.difficulty || 'Medium',
          estimated_time: row.estimated_time || globalReminder?.estimated_time || '',
          estimated_budget: row.estimated_budget || globalReminder?.estimated_budget || '',
          video_url: row.video_url || globalReminder?.video_url,
          instructions: row.instructions || globalReminder?.instructions || [],
          tools: row.tools || globalReminder?.tools || [],
          supplies: row.supplies || globalReminder?.supplies || [],
          why: row.why || globalReminder?.why,
          isPastDue,
          assignees: [assigneeName],
          assignedToNames: [assigneeName],
          assigneeUsername,
          isGlobalReminder: !!row.reminder_id,
          source,
          sourceGroupName
        };
      });
      
      console.log(`UserTaskService: Returning ${results.length} enriched tasks`);
      return results;
    } catch (error) {
      console.error('UserTaskService: getUserTasks critical failure:', error);
      return [];
    }
  }

  /**
   * Get completed tasks
   */
  static async getCompletedTasks(userId) {
    try {
      const { data: profileData } = await supabase
        .from('users')
        .select('family_id')
        .eq('id', userId)
        .maybeSingle();
      
      const familyId = profileData?.family_id;

      let query = supabase
        .from('user_tasks')
        .select('*')
        .not('completed_date', 'is', null);

      if (familyId) {
        query = query.or(`family_id.eq.${familyId},user_id.eq.${userId}`);
      } else {
        query = query.eq('user_id', userId);
      }

      const { data: tasks, error } = await query
        .order('completed_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      if (!tasks) return [];

      const completedByIds = [...new Set(tasks.map(row => row.completed_by).filter(Boolean))];
      let namesMap = {};
      
      if (completedByIds.length > 0) {
        const { data: profiles } = await supabase
          .from('users')
          .select('id, first_name, last_name')
          .in('id', completedByIds);

        if (profiles) {
          namesMap = profiles.reduce((acc, p) => {
            acc[p.id] = `${p.first_name} ${p.last_name}`.trim();
            return acc;
          }, {});
        }
      }

      return tasks.map(row => ({
        id: row.id,
        title: row.title || 'Completed Task',
        description: row.description || '',
        difficulty: row.difficulty || 'Easy',
        estimated_time: row.estimated_time || '',
        estimated_budget: row.estimated_budget || '',
        completed_date: row.last_completed,
        created_at: row.created_at,
        completed_by_name: row.completed_by ? namesMap[row.completed_by] : 'Unknown'
      }));
    } catch (error) {
      console.error('UserTaskService: getCompletedTasks error:', error);
      return [];
    }
  }

  static async addUserTask(userId, task) {
    try {
      const { data: profile } = await supabase.from('users').select('family_id').eq('id', userId).single();
      const dueDate = this.calculateDueDate(task.frequency_days || 30);
      
      const { data, error } = await supabase
        .from('user_tasks')
        .insert([{
          user_id: userId,
          family_id: profile?.family_id,
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

  static async enableReminderForUser(reminderId, userId) {
    try {
      const { data: profileData } = await supabase.from('users').select('*').eq('id', userId).single();
      if (!profileData) throw new Error('User not found');

      const { data: existingTask } = await supabase.from('user_tasks').select('id, enabled').eq('reminder_id', reminderId).eq('user_id', userId).maybeSingle();
      if (existingTask) {
        if (!existingTask.enabled) await supabase.from('user_tasks').update({ enabled: true }).eq('id', existingTask.id);
        return existingTask.id;
      }

      const reminder = await ReminderService.getReminderById(reminderId);
      const dueDate = this.calculateDueDate(reminder.frequency_days || 30);

      const { data, error } = await supabase
        .from('user_tasks')
        .insert([{
          user_id: userId,
          family_id: profileData.family_id,
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
          why: reminder.why || null,
          is_custom: false,
          reminder_type: 'global',
          enabled: true,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      throw error;
    }
  }

  static async completeTask(taskId) {
    try {
      const { data: task } = await supabase.from('user_tasks').select('*').eq('id', taskId).single();
      const { data: { user } } = await supabase.auth.getUser();
      const today = new Date().toISOString().split('T')[0];

      const updateData = { last_completed: today, completed_date: today, completed_by: user?.id, status: 'completed' };
      if (task.frequency === 'once' || task.frequency_days === 0) {
        updateData.enabled = false;
      } else {
        let nextDueDate = this.calculateNextDueDateFromFrequency(today, task.frequency, task.frequency_days);
        if (nextDueDate) {
          updateData.due_date = nextDueDate;
          updateData.status = 'pending';
        }
      }
      await supabase.from('user_tasks').update(updateData).eq('id', taskId);
      return true;
    } catch (error) {
      throw error;
    }
  }

  static calculateNextDueDateFromFrequency(completedDate, frequency, frequencyDays) {
    const completed = new Date(completedDate);
    let daysToAdd = frequencyDays || 30;
    switch (frequency?.toLowerCase()) {
      case 'weekly': daysToAdd = 7; break;
      case 'monthly': daysToAdd = 30; break;
      case 'quarterly': daysToAdd = 90; break;
      case 'seasonally': daysToAdd = 90; break;
      case 'yearly': daysToAdd = 365; break;
      case 'once': return null;
      default: daysToAdd = frequencyDays > 0 ? frequencyDays : 30;
    }
    const nextDue = new Date(completed.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return nextDue.toISOString().split('T')[0];
  }

  static async deleteUserTask(taskId) { await supabase.from('user_tasks').delete().eq('id', taskId); return true; }
  static async updateUserTask(taskId, updates) { await supabase.from('user_tasks').update(updates).eq('id', taskId); return true; }
  static calculateDueDate(frequencyDays) {
    const today = new Date();
    const dueDate = new Date(today.getTime() + (frequencyDays || 30) * 24 * 60 * 60 * 1000);
    return dueDate.toISOString().split('T')[0];
  }
  static getFrequencyString(days) {
    if (days === 0) return 'once';
    if (days <= 7) return 'weekly';
    if (days <= 30) return 'monthly';
    if (days <= 90) return 'quarterly';
    if (days <= 180) return 'seasonally';
    return 'yearly';
  }
}
