
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global reminders available to all users
const globalReminders = [
  {
    id: 'global-1',
    title: 'Change Air Filter',
    description: 'Replace HVAC air filter for better air quality',
    difficulty: 'Easy',
    estimated_time: '15 min',
    estimated_budget: '$10-20',
    frequency_days: 30,
    video_url: null,
    instructions: ['Turn off HVAC system', 'Remove old filter', 'Insert new filter', 'Turn system back on'],
    tools: ['Screwdriver'],
    supplies: ['Air filter'],
    reminder_type: 'maintenance',
    is_custom: false
  },
  {
    id: 'global-2',
    title: 'Clean Gutters',
    description: 'Remove debris from house gutters',
    difficulty: 'Medium',
    estimated_time: '2 hours',
    estimated_budget: '$0',
    frequency_days: 90,
    video_url: null,
    instructions: ['Set up ladder safely', 'Remove debris by hand', 'Flush with water', 'Check for damage'],
    tools: ['Ladder', 'Gloves', 'Garden hose'],
    supplies: ['Trash bags'],
    reminder_type: 'cleaning',
    is_custom: false
  },
  {
    id: 'global-3',
    title: 'Test Smoke Detectors',
    description: 'Test all smoke detectors and replace batteries if needed',
    difficulty: 'Easy',
    estimated_time: '30 min',
    estimated_budget: '$5-15',
    frequency_days: 180,
    video_url: null,
    instructions: ['Press test button on each detector', 'Replace batteries if beeping', 'Clean dust from detectors'],
    tools: ['Step ladder'],
    supplies: ['9V batteries'],
    reminder_type: 'safety',
    is_custom: false
  },
  {
    id: 'global-4',
    title: 'Service Water Heater',
    description: 'Flush water heater and check for leaks',
    difficulty: 'Hard',
    estimated_time: '1.5 hours',
    estimated_budget: '$20-50',
    frequency_days: 365,
    video_url: null,
    instructions: ['Turn off power/gas', 'Attach hose to drain valve', 'Flush tank completely', 'Check for leaks'],
    tools: ['Garden hose', 'Wrench set'],
    supplies: ['None'],
    reminder_type: 'maintenance',
    is_custom: false
  }
];

const USER_TASKS_KEY = 'user_tasks';
const GLOBAL_REMINDERS_KEY = 'global_reminders';

// Initialize global reminders in storage
export const initializeGlobalReminders = async () => {
  try {
    const existing = await AsyncStorage.getItem(GLOBAL_REMINDERS_KEY);
    if (!existing) {
      await AsyncStorage.setItem(GLOBAL_REMINDERS_KEY, JSON.stringify(globalReminders));
    }
  } catch (error) {
    console.error('Error initializing global reminders:', error);
  }
};

// Get all global reminders
export const getGlobalReminders = async () => {
  try {
    const data = await AsyncStorage.getItem(GLOBAL_REMINDERS_KEY);
    return data ? JSON.parse(data) : globalReminders;
  } catch (error) {
    console.error('Error loading global reminders:', error);
    return globalReminders;
  }
};

// Get user tasks
export const getUserTasks = async () => {
  try {
    const data = await AsyncStorage.getItem(USER_TASKS_KEY);
    const tasks = data ? JSON.parse(data) : [];
    
    // Calculate due status for each task
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return tasks.map(task => ({
      ...task,
      isPastDue: new Date(task.due_date) < today
    }));
  } catch (error) {
    console.error('Error loading user tasks:', error);
    return [];
  }
};

// Save user tasks
export const saveUserTasks = async (tasks) => {
  try {
    await AsyncStorage.setItem(USER_TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Error saving user tasks:', error);
  }
};

// Generate unique ID for user tasks
const generateId = () => {
  return 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

// Calculate due date based on frequency
const calculateDueDate = (frequencyDays) => {
  const today = new Date();
  const dueDate = new Date(today.getTime() + frequencyDays * 24 * 60 * 60 * 1000);
  return dueDate.toISOString().split('T')[0];
};

// Calculate next due date after completion
const calculateNextDueDate = (lastCompleted, frequencyDays) => {
  const completedDate = new Date(lastCompleted);
  const nextDue = new Date(completedDate.getTime() + frequencyDays * 24 * 60 * 60 * 1000);
  return nextDue.toISOString().split('T')[0];
};

// Enable a global reminder for the user
export const enableGlobalReminder = async (globalReminder) => {
  try {
    const userTasks = await getUserTasks();
    
    // Check if this reminder is already enabled
    const existingTask = userTasks.find(task => task.reminder_id === globalReminder.id);
    if (existingTask) {
      console.log('Reminder already enabled for user');
      return userTasks;
    }
    
    // Create new user task from global reminder
    const newUserTask = {
      id: generateId(),
      user_id: 'current-user', // In a real app, this would be the actual user ID
      reminder_id: globalReminder.id,
      title: globalReminder.title,
      description: globalReminder.description,
      difficulty: globalReminder.difficulty,
      estimated_time: globalReminder.estimated_time,
      estimated_budget: globalReminder.estimated_budget,
      frequency_days: globalReminder.frequency_days,
      due_date: calculateDueDate(globalReminder.frequency_days),
      last_completed: null,
      status: 'pending',
      video_url: globalReminder.video_url,
      instructions: globalReminder.instructions,
      tools: globalReminder.tools,
      supplies: globalReminder.supplies,
      reminder_type: globalReminder.reminder_type,
      is_custom: false,
      created_at: new Date().toISOString(),
      assignees: ['Family'],
      assignedToNames: ['Family']
    };
    
    const updatedTasks = [...userTasks, newUserTask];
    await saveUserTasks(updatedTasks);
    return updatedTasks;
  } catch (error) {
    console.error('Error enabling global reminder:', error);
    throw error;
  }
};

// Add custom user task
export const addCustomUserTask = async (taskData) => {
  try {
    const userTasks = await getUserTasks();
    
    const newUserTask = {
      id: generateId(),
      user_id: 'current-user',
      reminder_id: null, // Custom tasks don't have a reminder_id
      title: taskData.title,
      description: taskData.description || '',
      difficulty: taskData.difficulty || 'Easy',
      estimated_time: taskData.estimated_time || '30 min',
      estimated_budget: taskData.estimated_budget || '',
      frequency_days: taskData.frequency_days || 30,
      due_date: calculateDueDate(taskData.frequency_days || 30),
      last_completed: null,
      status: 'pending',
      video_url: taskData.video_url || null,
      instructions: taskData.instructions || [],
      tools: taskData.tools || [],
      supplies: taskData.supplies || [],
      reminder_type: 'custom',
      is_custom: true,
      created_at: new Date().toISOString(),
      assignees: taskData.assignees || ['Family'],
      assignedToNames: taskData.assignedToNames || ['Family']
    };
    
    const updatedTasks = [...userTasks, newUserTask];
    await saveUserTasks(updatedTasks);
    return updatedTasks;
  } catch (error) {
    console.error('Error adding custom user task:', error);
    throw error;
  }
};

// Mark user task as completed
export const markUserTaskCompleted = async (taskId) => {
  try {
    const userTasks = await getUserTasks();
    const today = new Date().toISOString().split('T')[0];
    
    const updatedTasks = userTasks.map(task => {
      if (task.id !== taskId) return task;
      
      const nextDueDate = calculateNextDueDate(today, task.frequency_days);
      
      return {
        ...task,
        last_completed: today,
        due_date: nextDueDate,
        status: 'completed'
      };
    });
    
    await saveUserTasks(updatedTasks);
    return updatedTasks;
  } catch (error) {
    console.error('Error marking task as completed:', error);
    throw error;
  }
};

// Delete user task
export const deleteUserTask = async (taskId) => {
  try {
    const userTasks = await getUserTasks();
    const updatedTasks = userTasks.filter(task => task.id !== taskId);
    await saveUserTasks(updatedTasks);
    return updatedTasks;
  } catch (error) {
    console.error('Error deleting user task:', error);
    throw error;
  }
};

// Update user task
export const updateUserTask = async (taskId, updates) => {
  try {
    const userTasks = await getUserTasks();
    const updatedTasks = userTasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    );
    await saveUserTasks(updatedTasks);
    return updatedTasks;
  } catch (error) {
    console.error('Error updating user task:', error);
    throw error;
  }
};

// Check if task is overdue
export const isTaskOverdue = (task) => {
  const dueDate = new Date(task.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};

// Initialize storage with data
export const initializeStorage = async () => {
  try {
    await initializeGlobalReminders();
    
    // Initialize user tasks if empty
    const existingTasks = await AsyncStorage.getItem(USER_TASKS_KEY);
    if (!existingTasks) {
      await saveUserTasks([]);
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
};
