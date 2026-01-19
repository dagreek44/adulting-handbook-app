import React, { createContext, useState, useEffect, useContext } from "react";
import { ReminderService } from "../services/ReminderService";
import { UserTaskService } from "../services/UserTaskService";
import { NotificationService } from "../services/NotificationService";
import { PushNotificationService } from "../services/PushNotificationService";
import { useAuth } from "./AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface UserTask {
  id: string;
  user_id: string;
  reminder_id?: string | null;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  estimated_budget: string;
  frequency_days: number;
  due_date: string;
  last_completed: string | null;
  completed_date?: string | null;
  status: string;
  enabled?: boolean;
  video_url?: string | null;
  instructions: string[];
  tools: string[];
  supplies: string[];
  reminder_type: string;
  is_custom: boolean;
  created_at: string;
  assignees: string[];
  assignedToNames: string[];
  isPastDue?: boolean;
}

export interface GlobalReminder {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  estimated_budget: string;
  frequency_days: number;
  video_url?: string | null;
  instructions: string[];
  tools: string[];
  supplies: string[];
  category: string;
  main_category?: string;
  subcategory?: string;
}

interface CompletedTask {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  estimated_budget: string;
  completed_date: string;
  created_at: string;
  completed_by?: string | null;
  completed_by_name?: string;
  assignee_name?: string;
}

interface ReminderContextType {
  userTasks: UserTask[];
  globalReminders: GlobalReminder[];
  completedTasks: CompletedTask[];
  loading: boolean;
  enableReminder: (globalReminder: GlobalReminder) => Promise<void>;
  addCustomTask: (taskData: Partial<UserTask>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<UserTask>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
  markTaskCompleted: (taskId: string) => Promise<void>;
  postponeTask: (taskId: string, newDate: Date) => Promise<void>;
}

export const ReminderContext = createContext<ReminderContextType | undefined>(undefined);

export const useReminders = () => {
  const context = useContext(ReminderContext);
  if (context === undefined) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
};

export const ReminderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [globalReminders, setGlobalReminders] = useState<GlobalReminder[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const [tasks, reminders, completed] = await Promise.all([
          UserTaskService.getUserTasks(user.id),
          ReminderService.getReminders(),
          UserTaskService.getCompletedTasks(user.id)
        ]);
        
        // Convert database tasks to context format
        const formattedTasks = tasks.map(task => ({
          ...task,
          reminder_type: task.is_custom ? 'custom' : 'global',
          created_at: task.created_at || new Date().toISOString()
        }));
        
        setUserTasks(formattedTasks);
        setGlobalReminders(reminders);
        setCompletedTasks(completed);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  const refreshTasks = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [tasks, completed] = await Promise.all([
        UserTaskService.getUserTasks(user.id),
        UserTaskService.getCompletedTasks(user.id)
      ]);
      
      const formattedTasks = tasks.map(task => ({
        ...task,
        reminder_type: task.is_custom ? 'custom' : 'global',
        created_at: task.created_at || new Date().toISOString()
      }));
      
      setUserTasks(formattedTasks);
      setCompletedTasks(completed);
    } catch (error) {
      console.error("Failed to refresh tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const enableReminder = async (globalReminder: GlobalReminder) => {
    if (!user?.id) {
      console.error('ReminderContext: No user ID available');
      return;
    }
    
    try {
      console.log('ReminderContext: Enabling reminder', globalReminder.id, 'for user', user.id);
      const taskId = await UserTaskService.enableReminderForUser(globalReminder.id, user.id);
      console.log('ReminderContext: Successfully enabled reminder, created task:', taskId);
      
      // Force refresh the tasks to show the new one
      console.log('ReminderContext: Refreshing tasks...');
      await refreshTasks();
      console.log('ReminderContext: Tasks refreshed');
    } catch (error) {
      console.error("ReminderContext: Failed to enable reminder:", error);
      throw error;
    }
  };

  const addCustomTask = async (taskData: Partial<UserTask>) => {
    if (!user?.id) return;
    
    try {
      const newTaskId = await UserTaskService.addUserTask(user.id, taskData);
      
      // Send push notification if task is for another user
      if (taskData.user_id && taskData.user_id !== user.id && taskData.due_date) {
        // Get creator's name from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        
        const creatorName = profile?.first_name 
          ? `${profile.first_name} ${profile.last_name || ''}`.trim()
          : user.email?.split('@')[0] || 'A family member';
        
        // Send push notification to recipient
        await PushNotificationService.notifyReminderCreated(
          taskData.user_id,
          creatorName,
          taskData.title || 'New reminder',
          newTaskId
        );
      }
      
      await refreshTasks();
    } catch (error) {
      console.error("Failed to add custom task:", error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<UserTask>) => {
    try {
      await UserTaskService.updateUserTask(taskId, updates);
      await refreshTasks();
    } catch (error) {
      console.error("Failed to update task:", error);
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await UserTaskService.deleteUserTask(taskId);
      await refreshTasks();
    } catch (error) {
      console.error("Failed to delete task:", error);
      throw error;
    }
  };

  const markTaskCompleted = async (taskId: string) => {
    try {
      // Get task details before completion
      const task = userTasks.find(t => t.id === taskId);
      
      await UserTaskService.completeTask(taskId);
      // Cancel the notification for this task
      await NotificationService.cancelNotification(taskId);
      
      // Send push notification to task creator if completed by someone else
      if (task && task.user_id !== user?.id) {
        // Get the original creator's user_id (we'd need to track this in the task)
        // For now, we'll get the completer's name
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user?.id)
          .single();
        
        const completedByName = profile?.first_name 
          ? `${profile.first_name} ${profile.last_name || ''}`.trim()
          : user?.email?.split('@')[0] || 'A family member';
        
        // Notify the task owner
        await PushNotificationService.notifyTaskCompleted(
          task.user_id,
          completedByName,
          task.title,
          taskId
        );
      }
      
      await refreshTasks();
    } catch (error) {
      console.error("Failed to mark task as completed:", error);
      throw error;
    }
  };

  const postponeTask = async (taskId: string, newDate: Date) => {
    try {
      const newDateString = newDate.toISOString().split('T')[0];
      await UserTaskService.updateUserTask(taskId, { due_date: newDateString });
      
      // Reschedule notification if task is due today
      const task = userTasks.find(t => t.id === taskId);
      if (task) {
        await NotificationService.scheduleReminderNotification(
          taskId,
          task.title,
          task.description,
          newDate
        );
      }
      
      await refreshTasks();
    } catch (error) {
      console.error("Failed to postpone task:", error);
      throw error;
    }
  };

  // Schedule notifications for tasks due today
  useEffect(() => {
    const scheduleTodayNotifications = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      for (const task of userTasks) {
        if (task.due_date === today && task.status !== 'completed') {
          try {
            await NotificationService.scheduleReminderNotification(
              task.id,
              task.title,
              task.description,
              new Date(task.due_date)
            );
          } catch (error) {
            console.error('Failed to schedule notification for task:', task.id, error);
          }
        }
      }
    };

    if (userTasks.length > 0) {
      // Add delay to ensure NotificationService is ready
      const timer = setTimeout(() => {
        scheduleTodayNotifications().catch(console.error);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [userTasks]);

  return (
    <ReminderContext.Provider
      value={{
        userTasks,
        globalReminders,
        completedTasks,
        loading,
        enableReminder,
        addCustomTask,
        updateTask,
        deleteTask,
        refreshTasks,
        markTaskCompleted,
        postponeTask,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};
