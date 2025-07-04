
import initSqlJs from 'sql.js';

class DatabaseService {
  constructor() {
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      const SQL = await initSqlJs({
        locateFile: file => `https://sql.js.org/dist/${file}`
      });

      // Try to load existing database from localStorage
      const savedDb = localStorage.getItem('home_maintenance_db');
      if (savedDb) {
        const dbData = new Uint8Array(JSON.parse(savedDb));
        this.db = new SQL.Database(dbData);
      } else {
        this.db = new SQL.Database();
        this.createTables();
        this.seedGlobalReminders();
      }

      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  createTables() {
    // Create reminders table for global reminders
    this.db.run(`
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        frequency_days INTEGER NOT NULL,
        category TEXT NOT NULL,
        difficulty TEXT DEFAULT 'Easy',
        estimated_time TEXT DEFAULT '30 min',
        estimated_budget TEXT DEFAULT '',
        video_url TEXT,
        instructions TEXT, -- JSON string
        tools TEXT, -- JSON string
        supplies TEXT -- JSON string
      )
    `);

    // Create user_tasks table for user-specific tasks
    this.db.run(`
      CREATE TABLE IF NOT EXISTS user_tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        reminder_id TEXT,
        title TEXT NOT NULL,
        description TEXT,
        frequency_days INTEGER NOT NULL,
        due_date DATE NOT NULL,
        last_completed DATE,
        status TEXT DEFAULT 'pending',
        difficulty TEXT DEFAULT 'Easy',
        estimated_time TEXT DEFAULT '30 min',
        estimated_budget TEXT DEFAULT '',
        video_url TEXT,
        instructions TEXT, -- JSON string
        tools TEXT, -- JSON string
        supplies TEXT, -- JSON string
        is_custom BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reminder_id) REFERENCES reminders(id)
      )
    `);

    this.saveToStorage();
  }

  seedGlobalReminders() {
    const globalReminders = [
      {
        id: 'global-1',
        title: 'Change Air Filter',
        description: 'Replace HVAC air filter for better air quality',
        frequency_days: 30,
        category: 'maintenance',
        difficulty: 'Easy',
        estimated_time: '15 min',
        estimated_budget: '$10-20',
        video_url: null,
        instructions: JSON.stringify(['Turn off HVAC system', 'Remove old filter', 'Insert new filter', 'Turn system back on']),
        tools: JSON.stringify(['Screwdriver']),
        supplies: JSON.stringify(['Air filter'])
      },
      {
        id: 'global-2',
        title: 'Clean Gutters',
        description: 'Remove debris from house gutters',
        frequency_days: 90,
        category: 'cleaning',
        difficulty: 'Medium',
        estimated_time: '2 hours',
        estimated_budget: '$0',
        video_url: null,
        instructions: JSON.stringify(['Set up ladder safely', 'Remove debris by hand', 'Flush with water', 'Check for damage']),
        tools: JSON.stringify(['Ladder', 'Gloves', 'Garden hose']),
        supplies: JSON.stringify(['Trash bags'])
      },
      {
        id: 'global-3',
        title: 'Test Smoke Detectors',
        description: 'Test all smoke detectors and replace batteries if needed',
        frequency_days: 180,
        category: 'safety',
        difficulty: 'Easy',
        estimated_time: '30 min',
        estimated_budget: '$5-15',
        video_url: null,
        instructions: JSON.stringify(['Press test button on each detector', 'Replace batteries if beeping', 'Clean dust from detectors']),
        tools: JSON.stringify(['Step ladder']),
        supplies: JSON.stringify(['9V batteries'])
      },
      {
        id: 'global-4',
        title: 'Service Water Heater',
        description: 'Flush water heater and check for leaks',
        frequency_days: 365,
        category: 'maintenance',
        difficulty: 'Hard',
        estimated_time: '1.5 hours',
        estimated_budget: '$20-50',
        video_url: null,
        instructions: JSON.stringify(['Turn off power/gas', 'Attach hose to drain valve', 'Flush tank completely', 'Check for leaks']),
        tools: JSON.stringify(['Garden hose', 'Wrench set']),
        supplies: JSON.stringify(['None'])
      }
    ];

    const stmt = this.db.prepare(`
      INSERT INTO reminders (id, title, description, frequency_days, category, difficulty, estimated_time, estimated_budget, video_url, instructions, tools, supplies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    globalReminders.forEach(reminder => {
      stmt.run([
        reminder.id,
        reminder.title,
        reminder.description,
        reminder.frequency_days,
        reminder.category,
        reminder.difficulty,
        reminder.estimated_time,
        reminder.estimated_budget,
        reminder.video_url,
        reminder.instructions,
        reminder.tools,
        reminder.supplies
      ]);
    });

    stmt.free();
    this.saveToStorage();
  }

  saveToStorage() {
    if (this.db) {
      const data = this.db.export();
      localStorage.setItem('home_maintenance_db', JSON.stringify(Array.from(data)));
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

export const databaseService = new DatabaseService();
