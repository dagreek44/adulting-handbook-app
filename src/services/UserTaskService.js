
import { databaseService } from './DatabaseService';
import { ReminderService } from './ReminderService';

export class UserTaskService {
  // Get all tasks for a specific user
  static async getUserTasks(userId) {
    await databaseService.initialize();
    
    try {
      const stmt = databaseService.db.prepare(`
        SELECT * FROM user_tasks 
        WHERE user_id = ? 
        ORDER BY due_date ASC
      `);
      stmt.bind([userId]);
      
      const results = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      while (stmt.step()) {
        const row = stmt.getAsObject();
        const isPastDue = new Date(row.due_date) < today;
        
        results.push({
          ...row,
          instructions: row.instructions ? JSON.parse(row.instructions) : [],
          tools: row.tools ? JSON.parse(row.tools) : [],
          supplies: row.supplies ? JSON.parse(row.supplies) : [],
          isPastDue,
          assignees: ['Family'],
          assignedToNames: ['Family']
        });
      }
      
      stmt.free();
      return results;
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      return [];
    }
  }

  // Add a custom user task
  static async addUserTask(userId, task) {
    await databaseService.initialize();
    
    try {
      const stmt = databaseService.db.prepare(`
        INSERT INTO user_tasks (id, user_id, title, description, frequency_days, due_date, difficulty, estimated_time, estimated_budget, video_url, instructions, tools, supplies, is_custom)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `);
      
      const id = 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      const dueDate = this.calculateDueDate(task.frequency_days || 30);
      
      stmt.run([
        id,
        userId,
        task.title,
        task.description || '',
        task.frequency_days || 30,
        dueDate,
        task.difficulty || 'Easy',
        task.estimated_time || '30 min',
        task.estimated_budget || '',
        task.video_url || null,
        JSON.stringify(task.instructions || []),
        JSON.stringify(task.tools || []),
        JSON.stringify(task.supplies || [])
      ]);
      
      stmt.free();
      databaseService.saveToStorage();
      return id;
    } catch (error) {
      console.error('Error adding user task:', error);
      throw error;
    }
  }

  // Enable a global reminder for a user
  static async enableReminderForUser(reminderId, userId) {
    await databaseService.initialize();
    
    try {
      // Check if task already exists for this user
      const existingStmt = databaseService.db.prepare(`
        SELECT id FROM user_tasks WHERE reminder_id = ? AND user_id = ?
      `);
      existingStmt.bind([reminderId, userId]);
      
      if (existingStmt.step()) {
        existingStmt.free();
        console.log('Task already exists for user');
        return null;
      }
      existingStmt.free();

      // Get the global reminder
      const reminder = await ReminderService.getReminderById(reminderId);
      if (!reminder) {
        throw new Error('Reminder not found');
      }

      // Create user task from global reminder
      const id = 'task-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      const dueDate = this.calculateDueDate(reminder.frequency_days);

      const stmt = databaseService.db.prepare(`
        INSERT INTO user_tasks (id, user_id, reminder_id, title, description, frequency_days, due_date, difficulty, estimated_time, estimated_budget, video_url, instructions, tools, supplies, is_custom)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `);

      stmt.run([
        id,
        userId,
        reminderId,
        reminder.title,
        reminder.description,
        reminder.frequency_days,
        dueDate,
        reminder.difficulty,
        reminder.estimated_time,
        reminder.estimated_budget,
        reminder.video_url,
        JSON.stringify(reminder.instructions),
        JSON.stringify(reminder.tools),
        JSON.stringify(reminder.supplies)
      ]);

      stmt.free();
      databaseService.saveToStorage();
      return id;
    } catch (error) {
      console.error('Error enabling reminder for user:', error);
      throw error;
    }
  }

  // Mark a task as completed
  static async completeTask(taskId) {
    await databaseService.initialize();
    
    try {
      // Get current task details
      const getStmt = databaseService.db.prepare('SELECT * FROM user_tasks WHERE id = ?');
      getStmt.bind([taskId]);
      
      if (!getStmt.step()) {
        getStmt.free();
        throw new Error('Task not found');
      }
      
      const task = getStmt.getAsObject();
      getStmt.free();
      
      const today = new Date().toISOString().split('T')[0];
      const nextDueDate = this.calculateNextDueDate(today, task.frequency_days);
      
      // Update task with completion
      const updateStmt = databaseService.db.prepare(`
        UPDATE user_tasks 
        SET last_completed = ?, due_date = ?, status = 'completed'
        WHERE id = ?
      `);
      
      updateStmt.run([today, nextDueDate, taskId]);
      updateStmt.free();
      
      databaseService.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error completing task:', error);
      throw error;
    }
  }

  // Delete a user task
  static async deleteUserTask(taskId) {
    await databaseService.initialize();
    
    try {
      const stmt = databaseService.db.prepare('DELETE FROM user_tasks WHERE id = ?');
      stmt.run([taskId]);
      stmt.free();
      
      databaseService.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error deleting user task:', error);
      throw error;
    }
  }

  // Update a user task
  static async updateUserTask(taskId, updates) {
    await databaseService.initialize();
    
    try {
      const fields = [];
      const values = [];
      
      Object.keys(updates).forEach(key => {
        if (key === 'instructions' || key === 'tools' || key === 'supplies') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(updates[key]));
        } else {
          fields.push(`${key} = ?`);
          values.push(updates[key]);
        }
      });
      
      values.push(taskId);
      
      const stmt = databaseService.db.prepare(`
        UPDATE user_tasks SET ${fields.join(', ')} WHERE id = ?
      `);
      
      stmt.run(values);
      stmt.free();
      
      databaseService.saveToStorage();
      return true;
    } catch (error) {
      console.error('Error updating user task:', error);
      throw error;
    }
  }

  // Helper method to calculate due date
  static calculateDueDate(frequencyDays) {
    const today = new Date();
    const dueDate = new Date(today.getTime() + frequencyDays * 24 * 60 * 60 * 1000);
    return dueDate.toISOString().split('T')[0];
  }

  // Helper method to calculate next due date after completion
  static calculateNextDueDate(lastCompleted, frequencyDays) {
    const completedDate = new Date(lastCompleted);
    const nextDue = new Date(completedDate.getTime() + frequencyDays * 24 * 60 * 60 * 1000);
    return nextDue.toISOString().split('T')[0];
  }
}
