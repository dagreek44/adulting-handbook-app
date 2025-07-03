
import React, { createContext, useState, useEffect, useContext } from "react";
import { getReminders, saveReminders, initializeStorage } from "../services/ReminderService";
import { UserTask } from "@/hooks/useSupabaseData";

interface ReminderContextType {
  reminders: UserTask[];
  loading: boolean;
  addReminder: (newReminder: UserTask) => Promise<void>;
  updateReminder: (updatedReminder: UserTask) => Promise<void>;
  deleteReminder: (reminderId: string) => Promise<void>;
  refreshReminders: () => Promise<void>;
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
  const [reminders, setReminders] = useState<UserTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize storage and load reminders on mount
  useEffect(() => {
    const loadReminders = async () => {
      try {
        await initializeStorage();
        const data = await getReminders();
        setReminders(data);
      } catch (error) {
        console.error("Failed to load reminders:", error);
      } finally {
        setLoading(false);
      }
    };

    loadReminders();
  }, []);

  const refreshReminders = async () => {
    try {
      setLoading(true);
      const data = await getReminders();
      setReminders(data);
    } catch (error) {
      console.error("Failed to refresh reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const addReminder = async (newReminder: UserTask) => {
    const updatedReminders = [...reminders, newReminder];
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
  };

  const updateReminder = async (updatedReminder: UserTask) => {
    const updatedReminders = reminders.map((reminder) =>
      reminder.id === updatedReminder.id ? updatedReminder : reminder
    );
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
  };

  const deleteReminder = async (reminderId: string) => {
    const updatedReminders = reminders.filter((reminder) => reminder.id !== reminderId);
    setReminders(updatedReminders);
    await saveReminders(updatedReminders);
  };

  return (
    <ReminderContext.Provider
      value={{
        reminders,
        loading,
        addReminder,
        updateReminder,
        deleteReminder,
        refreshReminders,
      }}
    >
      {children}
    </ReminderContext.Provider>
  );
};
