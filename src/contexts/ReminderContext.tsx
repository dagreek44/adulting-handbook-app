
import React, { createContext, useState, useEffect, useContext } from "react";
import { getReminders } from "../services/ReminderService";
import { UserTask } from "@/hooks/useSupabaseData";

interface ReminderContextType {
  reminders: UserTask[];
  loading: boolean;
  addReminder: (newReminder: UserTask) => void;
  updateReminder: (updatedReminder: UserTask) => void;
  deleteReminder: (reminderId: string) => void;
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

  // Load reminders on mount
  useEffect(() => {
    const loadReminders = async () => {
      try {
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

  const addReminder = (newReminder: UserTask) => {
    setReminders((prevReminders) => [...prevReminders, newReminder]);
  };

  const updateReminder = (updatedReminder: UserTask) => {
    setReminders((prevReminders) =>
      prevReminders.map((reminder) =>
        reminder.id === updatedReminder.id ? updatedReminder : reminder
      )
    );
  };

  const deleteReminder = (reminderId: string) => {
    setReminders((prevReminders) =>
      prevReminders.filter((reminder) => reminder.id !== reminderId)
    );
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
