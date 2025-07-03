
import { supabase } from '@/integrations/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock data for testing
const mockReminders = [
  {
    id: '1',
    reminder_id: 'mock-1',
    completed_date: null,
    enabled: true,
    due_date: '2024-01-15',
    frequency: 'monthly',
    frequency_days: 30,
    reminder_type: 'maintenance',
    created_at: '2024-01-01T00:00:00Z',
    title: 'Change Air Filter',
    description: 'Replace HVAC air filter for better air quality',
    difficulty: 'Easy',
    estimated_time: '15 min',
    estimated_budget: '$10-20',
    video_url: null,
    instructions: ['Turn off HVAC system', 'Remove old filter', 'Insert new filter', 'Turn system back on'],
    tools: ['Screwdriver'],
    supplies: ['Air filter'],
    assignees: ['Family'],
    is_custom: false,
    updated_at: '2024-01-01T00:00:00Z',
    last_completed: null,
    next_due: '2024-01-15',
    status: 'pending',
    isPastDue: false,
    assignedToNames: ['Family']
  },
  {
    id: '2',
    reminder_id: 'mock-2',
    completed_date: null,
    enabled: true,
    due_date: '2024-01-20',
    frequency: 'weekly',
    frequency_days: 7,
    reminder_type: 'cleaning',
    created_at: '2024-01-01T00:00:00Z',
    title: 'Clean Gutters',
    description: 'Remove debris from house gutters',
    difficulty: 'Medium',
    estimated_time: '2 hours',
    estimated_budget: '$0',
    video_url: null,
    instructions: ['Set up ladder safely', 'Remove debris by hand', 'Flush with water', 'Check for damage'],
    tools: ['Ladder', 'Gloves', 'Garden hose'],
    supplies: ['Trash bags'],
    assignees: ['Family'],
    is_custom: false,
    updated_at: '2024-01-01T00:00:00Z',
    last_completed: null,
    next_due: '2024-01-20',
    status: 'pending',
    isPastDue: false,
    assignedToNames: ['Family']
  }
];

const STORAGE_KEY = 'reminders';

export const getReminders = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    const reminders = data ? JSON.parse(data) : mockReminders;
    
    // Calculate due status for each reminder
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return reminders.map(reminder => ({
      ...reminder,
      isPastDue: new Date(reminder.next_due || reminder.due_date) < today
    }));
  } catch (error) {
    console.error('Error loading reminders from storage:', error);
    return mockReminders;
  }
};

export const saveReminders = async (reminders) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch (error) {
    console.error('Error saving reminders to storage:', error);
  }
};

export const getNextDueDate = (lastCompleted, frequencyDays) => {
  const completedDate = new Date(lastCompleted);
  return new Date(completedDate.getTime() + frequencyDays * 86400000);
};

export const markReminderCompleted = async (reminderId) => {
  try {
    const reminders = await getReminders();
    const today = new Date();
    
    const updatedReminders = reminders.map(reminder => {
      if (reminder.id !== reminderId) return reminder;
      
      const nextDue = getNextDueDate(today, reminder.frequency_days);
      
      return {
        ...reminder,
        last_completed: today.toISOString(),
        next_due: nextDue.toISOString(),
        status: 'completed',
        completed_date: today.toISOString().split('T')[0]
      };
    });
    
    await saveReminders(updatedReminders);
    return updatedReminders;
  } catch (error) {
    console.error('Error marking reminder as completed:', error);
    throw error;
  }
};

export const isOverdue = (reminder) => {
  const dueDate = new Date(reminder.next_due || reminder.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};

// Initialize storage with mock data if empty
export const initializeStorage = async () => {
  try {
    const existing = await AsyncStorage.getItem(STORAGE_KEY);
    if (!existing) {
      await saveReminders(mockReminders);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};
