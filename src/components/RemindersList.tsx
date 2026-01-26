
import TaskCard from '@/components/TaskCard';

interface UserTaskForList {
  id: string;
  title: string;
  description: string;
  estimated_time: string;
  difficulty: string;
  estimated_budget: string;
  due_date: string;
  isPastDue?: boolean;
  assignedToNames: string[];
  status: string;
  last_completed: string | null;
  next_due: string;
  why?: string;
  isGlobalReminder?: boolean;
}

interface RemindersListProps {
  upcomingTasks: UserTaskForList[];
  onTaskClick: (reminder: UserTaskForList) => void;
  onTaskComplete: (reminder: UserTaskForList) => Promise<void>;
  onPostpone?: (taskId: string, newDate: Date) => Promise<void>;
}

const RemindersList = ({ 
  upcomingTasks, 
  onTaskClick, 
  onTaskComplete,
  onPostpone 
}: RemindersListProps) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <div className="max-h-[400px] overflow-y-auto space-y-4 pr-1">
        {upcomingTasks.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No upcoming tasks</p>
        ) : (
          upcomingTasks.map((reminder) => (
            <TaskCard
              key={reminder.id}
              taskId={reminder.id}
              title={reminder.title}
              description={reminder.description}
              estimatedTime={reminder.estimated_time}
              difficulty={reminder.difficulty as 'Easy' | 'Medium' | 'Hard'}
              estimatedBudget={reminder.estimated_budget}
              dueDate={reminder.due_date || 'Not set'}
              isPastDue={reminder.isPastDue}
              assignedToNames={reminder.assignedToNames}
              isCompleted={reminder.status === 'completed'}
              lastCompleted={reminder.last_completed}
              nextDue={reminder.next_due}
              why={reminder.why}
              isGlobalReminder={reminder.isGlobalReminder}
              onComplete={() => onTaskComplete(reminder)}
              onPostpone={onPostpone ? (newDate) => onPostpone(reminder.id, newDate) : undefined}
              onClick={() => onTaskClick(reminder)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default RemindersList;
