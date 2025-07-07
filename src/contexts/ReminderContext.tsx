import React, { createContext, useState, useEffect, useContext } from "react";
import { ReminderService } from "../services/ReminderService";
import { UserTaskService } from "../services/UserTaskService";
import { useAuth } from "./AuthContext";

interface UserTask {
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
  status: string;
  video_url?: string | null;
  instructions: string[];
  tools: any[];
  supplies: any[];
  reminder_type: string;
  is_custom: boolean;
  created_at: string;
  assignees: string[];
  assignedToNames: string[];
  isPastDue?: boolean;
}

interface GlobalReminder {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimated_time: string;
  estimated_budget: string;
  frequency_days: number;
  video_url?: string | null;
  instructions: string[];
  tools: any[];
  supplies: any[];
  category: string;
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
      await UserTaskService.addUserTask(user.id, taskData);
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
      await UserTaskService.completeTask(taskId);
      await refreshTasks();
    } catch (error) {
      console.error("Failed to mark task as completed:", error);
      throw error;
    }
  };

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
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};
