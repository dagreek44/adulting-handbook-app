
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

interface ReminderContextType {
  userTasks: UserTask[];
  globalReminders: GlobalReminder[];
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
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();

  // Load data on mount and when user changes
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const [tasks, reminders] = await Promise.all([
          UserTaskService.getUserTasks(user.id),
          ReminderService.getReminders()
        ]);
        
        // Convert database tasks to context format
        const formattedTasks = tasks.map(task => ({
          ...task,
          reminder_type: task.is_custom ? 'custom' : 'global',
          created_at: task.created_at || new Date().toISOString()
        }));
        
        setUserTasks(formattedTasks);
        setGlobalReminders(reminders);
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
      const tasks = await UserTaskService.getUserTasks(user.id);
      const formattedTasks = tasks.map(task => ({
        ...task,
        reminder_type: task.is_custom ? 'custom' : 'global',
        created_at: task.created_at || new Date().toISOString()
      }));
      setUserTasks(formattedTasks);
    } catch (error) {
      console.error("Failed to refresh tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const enableReminder = async (globalReminder: GlobalReminder) => {
    if (!user?.id) return;
    
    try {
      await UserTaskService.enableReminderForUser(globalReminder.id, user.id);
      await refreshTasks();
    } catch (error) {
      console.error("Failed to enable reminder:", error);
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
