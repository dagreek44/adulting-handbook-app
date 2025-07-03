
import ReminderEditMode from '@/components/ReminderEditMode';
import ReminderCalendarView from '@/components/ReminderCalendarView';
import AddCustomReminder from '@/components/AddCustomReminder';
import ReminderLoadingState from '@/components/ReminderLoadingState';
import RemindersHeader from '@/components/RemindersHeader';
import ReminderViewToggle from '@/components/ReminderViewToggle';
import RemindersList from '@/components/RemindersList';
import CompletedTasksButton from '@/components/CompletedTasksButton';
import GlobalRemindersSelector from '@/components/GlobalRemindersSelector';
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
}: RemindersViewProps) => {
  // Use the new reminder context
  const { userTasks, globalReminders, loading, markTaskCompleted, enableReminder } = useReminders();

  // Filter to show only pending tasks (not completed ones)
  const pendingTasks = userTasks.filter(task => task.status !== 'completed');
  
  // Get only the next 3 upcoming tasks
  const upcomingTasks = pendingTasks.slice(0, 3);

  const handleTaskClick = (task: any) => {
    const taskDetails = {
      id: task.id,
      title: task.title,
      description: task.description,
      estimatedTime: task.estimated_time,
      difficulty: task.difficulty,
      estimatedBudget: task.estimated_budget,
      dueDate: task.due_date || 'Not set',
      videoUrl: task.video_url,
      instructions: task.instructions || [],
      tools: task.tools || [],
      supplies: task.supplies || []
    };
    setSelectedTask(taskDetails);
    setIsModalOpen(true);
  };

  const handleTaskComplete = async (task: any) => {
    try {
      await markTaskCompleted(task.id);
      await onTaskComplete(task);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleEnableReminder = async (globalReminder: any) => {
    try {
      await enableReminder(globalReminder);
    } catch (error) {
      console.error('Failed to enable reminder:', error);
    }
  };

  return (
    <div className="space-y-6">
      <RemindersHeader
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
        setIsFamilyModalOpen={setIsFamilyModalOpen}
      />

      <ReminderViewToggle
        reminderViewMode={reminderViewMode}
        setReminderViewMode={setReminderViewMode}
      />

      <ReminderLoadingState loading={loading} reminders={pendingTasks}>
        {reminderViewMode === 'list' ? (
          <RemindersList
            upcomingTasks={upcomingTasks}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
          />
        ) : (
          <ReminderCalendarView
            tasks={upcomingTasks.map(task => ({
              title: task.title,
              description: task.description,
              estimatedTime: task.estimated_time,
              difficulty: task.difficulty as 'Easy' | 'Medium' | 'Hard',
              dueDate: task.due_date || 'Not set',
            }))}
            reminders={pendingTasks}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
            familyMembers={familyMembers}
            supabaseOperations={{
              addReminder: async () => {},
              updateReminder: async () => {},
              deleteReminder: async () => {},
              toggleReminderEnabled: async () => {}
            }}
          />
        )}
      </ReminderLoadingState>

      <GlobalRemindersSelector
        globalReminders={globalReminders}
        enabledTaskIds={userTasks.map(task => task.reminder_id).filter(Boolean)}
        onEnableReminder={handleEnableReminder}
      />

      <AddCustomReminder
        familyMembers={familyMembers}
        supabaseOperations={{
          addReminder: async () => {},
          updateReminder: async () => {},
          deleteReminder: async () => {},
          toggleReminderEnabled: async () => {}
        }}
      />

      <CompletedTasksButton onNavigateToCompleted={onNavigateToCompleted} />
    </div>
  );
};

export default RemindersView;
