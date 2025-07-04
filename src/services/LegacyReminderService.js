// DEPRECATED: This file has been replaced by the new database-driven services
// Use ReminderService.js and UserTaskService.js instead

import { ReminderService as NewReminderService } from './ReminderService';
import { UserTaskService } from './UserTaskService';

// Legacy functions that redirect to new services for backward compatibility
export const getUserTasks = async () => {
  console.warn('DEPRECATED: Use UserTaskService.getUserTasks() instead');
  return await UserTaskService.getUserTasks('current-user');
};

export const getGlobalReminders = async () => {
  console.warn('DEPRECATED: Use ReminderService.getReminders() instead');
  return await NewReminderService.getReminders();
};

export const enableGlobalReminder = async (globalReminder) => {
  console.warn('DEPRECATED: Use UserTaskService.enableReminderForUser() instead');
  return await UserTaskService.enableReminderForUser(globalReminder.id, 'current-user');
};

export const markUserTaskCompleted = async (taskId) => {
  console.warn('DEPRECATED: Use UserTaskService.completeTask() instead');
  await UserTaskService.completeTask(taskId);
  return await UserTaskService.getUserTasks('current-user');
};

export const addCustomUserTask = async (taskData) => {
  console.warn('DEPRECATED: Use UserTaskService.addUserTask() instead');
  await UserTaskService.addUserTask('current-user', taskData);
  return await UserTaskService.getUserTasks('current-user');
};

export const deleteUserTask = async (taskId) => {
  console.warn('DEPRECATED: Use UserTaskService.deleteUserTask() instead');
  await UserTaskService.deleteUserTask(taskId);
  return await UserTaskService.getUserTasks('current-user');
};

export const updateUserTask = async (taskId, updates) => {
  console.warn('DEPRECATED: Use UserTaskService.updateUserTask() instead');
  await UserTaskService.updateUserTask(taskId, updates);
  return await UserTaskService.getUserTasks('current-user');
};

// Keep other utility functions for backward compatibility
export const initializeStorage = async () => {
  console.warn('DEPRECATED: Database initialization is now handled automatically');
};

export const isTaskOverdue = (task) => {
  const dueDate = new Date(task.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};
