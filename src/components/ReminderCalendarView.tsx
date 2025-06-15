import { useState, useMemo } from 'react';
import { Calendar as LucideCalendar, Plus } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, parse, isValid } from 'date-fns';
import TaskCard from './TaskCard';

interface Reminder {
  id: string;
  title: string;
  description: string;
  frequency: string;
  enabled: boolean;
  isCustom?: boolean;
  date?: Date | null;
  assignees?: string[];
}

interface ReminderCalendarViewProps {
  tasks: Array<{
    title: string;
    description: string;
    estimatedTime: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    dueDate: string;
  }>;
  reminders?: Reminder[];
  setReminders?: (reminders: Reminder[]) => void;
  onTaskClick: (task: any) => void;
  onTaskComplete: () => void;
}

// Helper function to normalize dates from strings such as "In 3 days", "Next week", "This weekend", "Set date", or MM/dd/yyyy-like formats
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
    // Find next Saturday
    const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSaturday);
  }
  if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(dueDateString)) {
    // MM/dd/yyyy
    const parsed = parse(dueDateString, 'MM/dd/yyyy', new Date());
    if (isValid(parsed)) return parsed;
  }
  if (/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(dueDateString)) {
    // fallback to ISO
    const parsed = new Date(dueDateString);
    if (isValid(parsed)) return parsed;
  }
  // Otherwise: do not match
  return null;
}

// Helper function for Reminder objects (with .date)
function isSameDayReminder(d1?: Date | null, d2?: Date) {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

const ReminderCalendarView = ({
  tasks,
  reminders,
  setReminders,
  onTaskClick,
  onTaskComplete
}: ReminderCalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [adding, setAdding] = useState(false);
  const [newReminderTitle, setNewReminderTitle] = useState('');
  const [newReminderDesc, setNewReminderDesc] = useState('');

  // Memo: date string keys for due reminders in standard tasks
  const reminderDates = useMemo(() => {
    return tasks
      .map(task => parseDueDate(task.dueDate))
      .filter((d): d is Date => d !== null)
      .map(d => format(d, 'yyyy-MM-dd'));
  }, [tasks]);

  // Custom Day icon
  function CustomDay(props: any) {
    // The day (Date) is passed via props.date
    const { date, ...rest } = props;
    const todayStr = format(date, 'yyyy-MM-dd');
    const hasReminder = reminderDates.includes(todayStr) ||
      (reminders && reminders.some(r => r.date && isSameDayReminder(r.date, date)));
    return (
      <button {...rest} type="button" tabIndex={0}>
        <div className="relative w-full h-full flex items-center justify-center">
          <span>{date.getDate()}</span>
          {hasReminder && (
            <span className="absolute bottom-0 right-0">
              <LucideCalendar className="w-3 h-3 text-blue-500" aria-label="Reminder due" />
            </span>
          )}
        </div>
      </button>
    );
  }

  // Show all standard (tasks) for selected date
  const selectedTasks = selectedDate
    ? tasks.filter(task => {
        const dueDate = parseDueDate(task.dueDate);
        return dueDate && isSameDay(selectedDate, dueDate);
      })
    : [];

  // Show all custom (reminder) tasks for selected date
  const selectedReminders = selectedDate && reminders
    ? reminders.filter(r => r.date && isSameDayReminder(r.date, selectedDate))
    : [];

  // Handler: add reminder for this date
  function handleAddReminder() {
    if (!setReminders || !selectedDate || !newReminderTitle.trim()) return;
    setReminders([
      ...reminders!,
      {
        id: `${Date.now()}`,
        title: newReminderTitle,
        description: newReminderDesc,
        frequency: "once",
        enabled: true,
        isCustom: true,
        date: selectedDate,
        assignees: [],
      }
    ]);
    setAdding(false);
    setNewReminderTitle('');
    setNewReminderDesc('');
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Select a Date</h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border mx-auto"
          components={{
            Day: CustomDay
          }}
        />
      </div>

      {selectedDate && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Reminders for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>

          {/* Existing reminders (custom) */}
          {(selectedReminders && selectedReminders.length > 0) && (
            <div className="space-y-4 mb-4">
              {selectedReminders.map(r => (
                <TaskCard
                  key={r.id}
                  title={r.title}
                  description={r.description}
                  estimatedTime="Varies"
                  difficulty="Easy"
                  dueDate={r.date ? format(r.date, 'MM/dd/yyyy') : ''}
                  isCompleted={false}
                  onComplete={onTaskComplete}
                  onClick={() => onTaskClick(r)}
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

          {/* Add Reminder if none found */}
          {(selectedReminders?.length === 0 && selectedTasks.length === 0) && (
            !adding ? (
              <button
                className="flex items-center bg-sage text-white px-4 py-2 rounded-lg hover:bg-sage/90 transition-colors mx-auto mt-4"
                onClick={() => setAdding(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Reminder for this date
              </button>
            ) : (
              <form
                className="bg-cream p-4 rounded-lg mt-2 flex flex-col gap-3"
                onSubmit={e => {
                  e.preventDefault();
                  handleAddReminder();
                }}
              >
                <input
                  className="border rounded p-2"
                  placeholder="Reminder Title"
                  value={newReminderTitle}
                  onChange={e => setNewReminderTitle(e.target.value)}
                  required
                />
                <textarea
                  className="border rounded p-2"
                  placeholder="Description (optional)"
                  value={newReminderDesc}
                  onChange={e => setNewReminderDesc(e.target.value)}
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="bg-blue-soft text-white px-4 py-2 rounded hover:bg-blue-400 transition-colors"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                    onClick={() => setAdding(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default ReminderCalendarView;
