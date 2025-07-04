
import { databaseService } from './DatabaseService';

export class ReminderService {
  // Get all global reminders
  static async getReminders() {
    await databaseService.initialize();
    
    try {
      const stmt = databaseService.db.prepare('SELECT * FROM reminders ORDER BY title ASC');
      const results = [];
      
      while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push({
          ...row,
          instructions: row.instructions ? JSON.parse(row.instructions) : [],
          tools: row.tools ? JSON.parse(row.tools) : [],
          supplies: row.supplies ? JSON.parse(row.supplies) : []
        });
      }
      
      stmt.free();
      return results;
    } catch (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }
  }

  // Get a single reminder by ID
  static async getReminderById(id) {
    await databaseService.initialize();
    
    try {
      const stmt = databaseService.db.prepare('SELECT * FROM reminders WHERE id = ?');
      stmt.bind([id]);
      
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return {
          ...row,
          instructions: row.instructions ? JSON.parse(row.instructions) : [],
          tools: row.tools ? JSON.parse(row.tools) : [],
          supplies: row.supplies ? JSON.parse(row.supplies) : []
        };
      }
      
      stmt.free();
      return null;
    } catch (error) {
      console.error('Error fetching reminder by ID:', error);
      return null;
    }
  }

  // Add a new global reminder (admin function)
  static async addReminder(reminder) {
    await databaseService.initialize();
    
    try {
      const stmt = databaseService.db.prepare(`
        INSERT INTO reminders (id, title, description, frequency_days, category, difficulty, estimated_time, estimated_budget, video_url, instructions, tools, supplies)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const id = 'global-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      
      stmt.run([
        id,
        reminder.title,
        reminder.description || '',
        reminder.frequency_days || 30,
        reminder.category || 'maintenance',
        reminder.difficulty || 'Easy',
        reminder.estimated_time || '30 min',
        reminder.estimated_budget || '',
        reminder.video_url || null,
        JSON.stringify(reminder.instructions || []),
        JSON.stringify(reminder.tools || []),
        JSON.stringify(reminder.supplies || [])
      ]);
      
      stmt.free();
      databaseService.saveToStorage();
      return id;
    } catch (error) {
      console.error('Error adding reminder:', error);
      throw error;
    }
  }
}
