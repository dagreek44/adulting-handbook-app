
import React, { createContext, useState, useEffect, useContext } from "react";
import { 
  getUserTasks, 
  getGlobalReminders,
  initializeStorage, 
  markUserTaskCompleted,
  enableGlobalReminder,
  addCustomUserTask,
  deleteUserTask,
  updateUserTask
} from "../services/ReminderService";

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
  tools: string[];
  supplies: string[];
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
  tools: string[];
  supplies: string[];
  reminder_type: string;
  is_custom: boolean;
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

  // Initialize storage and load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await initializeStorage();
        const [tasks, reminders] = await Promise.all([
          getUserTasks(),
          getGlobalReminders()
        ]);
        setUserTasks(tasks);
        setGlobalReminders(reminders);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshTasks = async () => {
    try {
      setLoading(true);
      const tasks = await getUserTasks();
      setUserTasks(tasks);
    } catch (error) {
      console.error("Failed to refresh tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const enableReminder = async (globalReminder: GlobalReminder) => {
    try {
      const updatedTasks = await enableGlobalReminder(globalReminder);
      setUserTasks(updatedTasks);
    } catch (error) {
      console.error("Failed to enable reminder:", error);
      throw error;
    }
  };

  const addCustomTask = async (taskData: Partial<UserTask>) => {
    try {
      const updatedTasks = await addCustomUserTask(taskData);
      setUserTasks(updatedTasks);
    } catch (error) {
      console.error("Failed to add custom task:", error);
      throw error;
    }
  };

  const updateTask = async (taskId: string, updates: Partial<UserTask>) => {
    try {
      const updatedTasks = await updateUserTask(taskId, updates);
      setUserTasks(updatedTasks);
    } catch (error) {
      console.error("Failed to update task:", error);
      throw error;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const updatedTasks = await deleteUserTask(taskId);
      setUserTasks(updatedTasks);
    } catch (error) {
      console.error("Failed to delete task:", error);
      throw error;
    }
  };

  const markTaskCompleted = async (taskId: string) => {
    try {
      const updatedTasks = await markUserTaskCompleted(taskId);
      setUserTasks(updatedTasks);
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
