import { useState, useMemo } from 'react';
import { Wrench, Plus, X } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, parse, isValid } from 'date-fns';
import TaskCard from './TaskCard';
import { SupabaseReminder, FamilyMember } from '@/hooks/useSupabaseData';

interface ReminderCalendarViewProps {
  tasks: Array<{
    title: string;
    description: string;
    estimatedTime: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    dueDate: string;
  }>;
  reminders: SupabaseReminder[];
  onTaskClick: (task: any) => void;
  onTaskComplete: () => void;
  familyMembers: FamilyMember[];
  supabaseOperations: {
    addReminder: (reminder: Partial<SupabaseReminder>) => Promise<void>;
  };
}

// Helper function to normalize dates from strings
function parseDueDate(dueDateString: string): Date | null {
  if (!dueDateString) return null;
  const lc = dueDateString.toLowerCase();
  const now = new Date();
  if (lc.includes('in 3 days')) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3);
  }
  if (lc.includes('next week')) {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
  }
  if (lc.includes('this weekend')) {
    const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSaturday);
  }
  if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(dueDateString)) {
    const parsed = parse(dueDateString, 'MM/dd/yyyy', new Date());
    if (isValid(parsed)) return parsed;
  }
  if (/\d{4}-\d{2}-\d{2}/.test(dueDateString)) {
    const parsed = new Date(dueDateString);
    if (isValid(parsed)) return parsed;
  }
  return null;
}

const frequencies = [
  "once",
  "weekly", 
  "monthly",
  "quarterly",
  "seasonally",
  "yearly"
];

const ReminderCalendarView = ({
  tasks,
  reminders,
  onTaskClick,
  onTaskComplete,
  familyMembers,
  supabaseOperations
}: ReminderCalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [adding, setAdding] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDesc, setNewReminderDesc] = useState('');
  const [newReminderFreq, setNewReminderFreq] = useState('monthly');
  const [showDateView, setShowDateView] = useState(false);

  // Get dates that have reminders
  const reminderDates = useMemo(() => {
    const taskDates = tasks
      .map(task => parseDueDate(task.dueDate))
      .filter((d): d is Date => d !== null)
      .map(d => format(d, 'yyyy-MM-dd'));
    
    const actualReminderDates = reminders
      .filter(r => r.due_date)
      .map(r => r.due_date!);
    
    return [...taskDates, ...actualReminderDates];
  }, [tasks, reminders]);

  // Custom Day component with wrench icons
  function CustomDay(props: any) {
    const { date, ...rest } = props;
    const todayStr = format(date, 'yyyy-MM-dd');
    const hasReminder = reminderDates.includes(todayStr);
    
    return (
      <button {...rest} type="button" tabIndex={0}>
        <div className="relative w-full h-full flex items-center justify-center">
          <span>{date.getDate()}</span>
          {hasReminder && (
            <span className="absolute bottom-0 right-0">
              <Wrench className="w-3 h-3 text-sage" />
            </span>
          )}
        </div>
      </button>
    );
  }

  // Get reminders for selected date
  const selectedTasks = selectedDate
    ? tasks.filter(task => {
        const dueDate = parseDueDate(task.dueDate);
        return dueDate && isSameDay(selectedDate, dueDate);
      })
    : [];

  const selectedReminders = selectedDate
    ? reminders.filter(r => r.due_date && isSameDay(new Date(r.due_date), selectedDate))
    : [];

  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setShowDateView(true);
    }
  };

  // Add reminder for selected date
  const handleAddReminder = async () => {
    if (!selectedDate || !newReminderTitle.trim()) return;
    
    const customReminder: Partial<SupabaseReminder> = {
      title: newReminderTitle,
      description: newReminderDesc,
      frequency: newReminderFreq,
      enabled: true,
      is_custom: true,
      due_date: format(selectedDate, 'yyyy-MM-dd'),
      assignees: [],
      difficulty: 'Easy',
      estimated_time: '30 min',
      estimated_budget: '$10-20',
      instructions: [],
      tools: [],
      supplies: []
    };

    await supabaseOperations.addReminder(customReminder);
    setAdding(false);
    setNewReminderTitle('');
    setNewReminderDesc('');
    setNewReminderFreq('monthly');
  };

  if (showDateView && selectedDate) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Reminders for {format(selectedDate, 'MMMM d, yyyy')}
            </h3>
            <button
              onClick={() => setShowDateView(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Existing reminders */}
          {selectedReminders.length > 0 && (
            <div className="space-y-4 mb-4">
              {selectedReminders.map(reminder => (
                <TaskCard
                  key={reminder.id}
                  title={reminder.title}
                  description={reminder.description}
                  estimatedTime={reminder.estimated_time}
                  difficulty={reminder.difficulty as 'Easy' | 'Medium' | 'Hard'}
                  estimatedBudget={reminder.estimated_budget}
                  dueDate={reminder.due_date || 'Not set'}
                  isPastDue={reminder.isPastDue}
                  assignedToNames={reminder.assignedToNames}
                  isCompleted={false}
                  onComplete={onTaskComplete}
                  onClick={() => onTaskClick(reminder)}
                />
              ))}
            </div>
          )}

          {/* Scheduled standard tasks */}
          {selectedTasks.length > 0 && (
            <div className="space-y-4 mb-4">
              {selectedTasks.map((task, index) => (
                <TaskCard
                  key={index}
                  {...task}
                  isCompleted={false}
                  onComplete={onTaskComplete}
                  onClick={() => onTaskClick(task)}
                />
              ))}
            </div>
          )}

          {/* Add Reminder Section */}
          {!adding ? (
            <button
              className="flex items-center bg-sage text-white px-4 py-2 rounded-lg hover:bg-sage/90 transition-colors w-full justify-center mb-4"
              onClick={() => setAdding(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Reminder for this date
            </button>
          ) : (
            <div className="bg-sage/10 p-4 rounded-lg mb-4 space-y-3">
              <input
                className="w-full p-2 border border-gray-300 rounded-lg"
                placeholder="Reminder Title"
                value={newReminderTitle}
                onChange={e => setNewReminderTitle(e.target.value)}
                required
              />
              <textarea
                className="w-full p-2 border border-gray-300 rounded-lg h-20 resize-none"
                placeholder="Description (optional)"
                value={newReminderDesc}
                onChange={e => setNewReminderDesc(e.target.value)}
              />
              <select
                value={newReminderFreq}
                onChange={e => setNewReminderFreq(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                {frequencies.map(f => (
                  <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                ))}
              </select>
              <div className="flex gap-3">
                <button
                  onClick={handleAddReminder}
                  disabled={!newReminderTitle.trim()}
                  className="bg-sage text-white px-4 py-2 rounded hover:bg-sage/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  onClick={() => setAdding(false)}
                  className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowDateView(false)}
            className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Select a Date</h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          className="rounded-md border mx-auto"
          components={{
            Day: CustomDay
          }}
        />
      </div>
    </div>
  );
};

export default ReminderCalendarView;
