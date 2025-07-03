
import ReminderEditMode from '@/components/ReminderEditMode';
import ReminderCalendarView from '@/components/ReminderCalendarView';
import AddCustomReminder from '@/components/AddCustomReminder';
import ReminderLoadingState from '@/components/ReminderLoadingState';
import RemindersHeader from '@/components/RemindersHeader';
import ReminderViewToggle from '@/components/ReminderViewToggle';
import RemindersList from '@/components/RemindersList';
import CompletedTasksButton from '@/components/CompletedTasksButton';
import { UserTask, FamilyMember, SupabaseReminder } from '@/hooks/useSupabaseData';
import { useReminders } from '@/contexts/ReminderContext';

interface RemindersViewProps {
  allReminders: SupabaseReminder[];
  familyMembers: FamilyMember[];
  setFamilyMembers: (members: FamilyMember[]) => void;
  completedTasks: number;
  onTaskComplete: (task?: any) => void;
  selectedTask: any;
  setSelectedTask: (task: any) => void;
  setIsModalOpen: (b: boolean) => void;
  isEditMode: boolean;
  setIsEditMode: (b: boolean) => void;
  reminderViewMode: 'list' | 'calendar';
  setReminderViewMode: (m: 'list' | 'calendar') => void;
  isFamilyModalOpen: boolean;
  setIsFamilyModalOpen: (b: boolean) => void;
  onNavigateToCompleted: () => void;
  supabaseOperations: {
    addReminder: (reminder: Partial<SupabaseReminder>) => Promise<void>;
    updateReminder: (id: string, updates: Partial<SupabaseReminder>) => Promise<void>;
    deleteReminder: (id: string) => Promise<void>;
    toggleReminderEnabled: (id: string, enabled: boolean) => Promise<void>;
  };
}

const RemindersView = ({
  allReminders,
  familyMembers,
  setFamilyMembers,
  completedTasks,
  onTaskComplete,
  selectedTask,
  setSelectedTask,
  setIsModalOpen,
  isEditMode,
  setIsEditMode,
  reminderViewMode,
  setReminderViewMode,
  isFamilyModalOpen,
  setIsFamilyModalOpen,
  onNavigateToCompleted,
  supabaseOperations
}: RemindersViewProps) => {
  // Use reminders from context instead of props
  const { reminders, loading, refreshReminders, markReminderCompleted } = useReminders();

  // Filter to show only pending reminders (not completed ones)
  const pendingReminders = reminders.filter(reminder => reminder.status !== 'completed');
  
  // Get only the next 3 upcoming tasks
  const upcomingTasks = pendingReminders.slice(0, 3);

  const handleTaskClick = (reminder: UserTask) => {
    const taskDetails = {
      id: reminder.id,
      title: reminder.title,
      description: reminder.description,
      estimatedTime: reminder.estimated_time,
      difficulty: reminder.difficulty,
      estimatedBudget: reminder.estimated_budget,
      dueDate: reminder.due_date || 'Not set',
      videoUrl: reminder.video_url,
      instructions: reminder.instructions || [],
      tools: reminder.tools || [],
      supplies: reminder.supplies || []
    };
    setSelectedTask(taskDetails);
    setIsModalOpen(true);
  };

  const handleTaskComplete = async (reminder: UserTask) => {
    try {
      await markReminderCompleted(reminder.id);
      await onTaskComplete(reminder);
      // Refresh reminders after completing a task
      await refreshReminders();
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  return (
    <div className="space-y-6">
      <RemindersHeader
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        setIsFamilyModalOpen={setIsFamilyModalOpen}
      />

      <ReminderEditMode
        isEditMode={isEditMode}
        onExitEdit={() => setIsEditMode(false)}
        allReminders={allReminders}
        familyMembers={familyMembers}
        supabaseOperations={supabaseOperations}
      />

      <ReminderViewToggle
        reminderViewMode={reminderViewMode}
        setReminderViewMode={setReminderViewMode}
      />

      <ReminderLoadingState loading={loading} reminders={pendingReminders}>
        {reminderViewMode === 'list' ? (
          <RemindersList
            upcomingTasks={upcomingTasks}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
          />
        ) : (
          <ReminderCalendarView
            tasks={upcomingTasks.map(reminder => ({
              title: reminder.title,
              description: reminder.description,
              estimatedTime: reminder.estimated_time,
              difficulty: reminder.difficulty as 'Easy' | 'Medium' | 'Hard',
              dueDate: reminder.next_due || reminder.due_date || 'Not set',
            }))}
            reminders={pendingReminders}
            onTaskClick={handleTaskClick}
            onTaskComplete={() => handleTaskComplete}
            familyMembers={familyMembers}
            supabaseOperations={supabaseOperations}
          />
        )}
      </ReminderLoadingState>

      <AddCustomReminder
        familyMembers={familyMembers}
        supabaseOperations={supabaseOperations}
      />

      <CompletedTasksButton onNavigateToCompleted={onNavigateToCompleted} />
    </div>
  );
};

export default RemindersView;
