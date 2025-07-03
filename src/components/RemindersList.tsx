
import TaskCard from '@/components/TaskCard';
import { UserTask } from '@/hooks/useSupabaseData';

interface RemindersListProps {
  upcomingTasks: UserTask[];
  onTaskClick: (reminder: UserTask) => void;
  onTaskComplete: (reminder: UserTask) => Promise<void>;
}

const RemindersList = ({ 
  upcomingTasks, 
  onTaskClick, 
  onTaskComplete 
}: RemindersListProps) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Next 3 Upcoming Tasks</h3>
      <div className="space-y-4">
        {upcomingTasks.map((reminder) => (
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
            isCompleted={reminder.status === 'completed'}
            lastCompleted={reminder.last_completed}
            nextDue={reminder.next_due}
            onComplete={() => onTaskComplete(reminder)}
            onClick={() => onTaskClick(reminder)}
          />
        ))}
      </div>
    </div>
  );
};

export default RemindersList;
