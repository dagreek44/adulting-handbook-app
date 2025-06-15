
import { useState, useMemo } from 'react';
import { Calendar as LucideCalendar } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay, parse, isValid } from 'date-fns';
import TaskCard from './TaskCard';

interface ReminderCalendarViewProps {
  tasks: Array<{
    title: string;
    description: string;
    estimatedTime: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    dueDate: string;
  }>;
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

const ReminderCalendarView = ({ tasks, onTaskClick, onTaskComplete }: ReminderCalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Build a set of dueDates so we can easily check per day (format yyyy-MM-dd)
  const reminderDates = useMemo(() => {
    return tasks
      .map(task => parseDueDate(task.dueDate))
      .filter((d): d is Date => d !== null)
      .map(d => format(d, 'yyyy-MM-dd'));
  }, [tasks]);

  // Custom Day component for calendar
  function CustomDay(props: any) {
    // The day (Date) is passed via props.date
    const { date, ...rest } = props;
    const todayStr = format(date, 'yyyy-MM-dd');
    const hasReminder = reminderDates.includes(todayStr);

    // The rest of the props are for button, including "children", "selected", etc.
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

  // Show all tasks for the selected date
  const selectedTasks = selectedDate
    ? tasks.filter(task => {
        const dueDate = parseDueDate(task.dueDate);
        return dueDate && isSameDay(selectedDate, dueDate);
      })
    : [];

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
            Tasks for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          {selectedTasks.length > 0 ? (
            <div className="space-y-4">
              {selectedTasks.map((task, index) => (
                <TaskCard
                  key={index}
                  {...task}
                  onComplete={onTaskComplete}
                  onClick={() => onTaskClick(task)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No tasks scheduled for this date</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReminderCalendarView;
