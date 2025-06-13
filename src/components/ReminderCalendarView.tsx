
import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { format, isSameDay } from 'date-fns';
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

const ReminderCalendarView = ({ tasks, onTaskClick, onTaskComplete }: ReminderCalendarViewProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Mock function to get tasks for a specific date
  const getTasksForDate = (date: Date) => {
    // For demo purposes, we'll show all tasks for any selected date
    // In a real app, you'd filter based on actual due dates
    return tasks;
  };

  const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Select a Date</h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border mx-auto"
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
