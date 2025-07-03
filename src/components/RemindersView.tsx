
import ReminderEditMode from '@/components/ReminderEditMode';
import ReminderCalendarView from '@/components/ReminderCalendarView';
import AddCustomReminder from '@/components/AddCustomReminder';
import ReminderLoadingState from '@/components/ReminderLoadingState';
import RemindersHeader from '@/components/RemindersHeader';
import ReminderViewToggle from '@/components/ReminderViewToggle';
import RemindersList from '@/components/RemindersList';
import CompletedTasksButton from '@/components/CompletedTasksButton';
import GlobalRemindersSelector from '@/components/GlobalRemindersSelector';
import { FamilyMember, SupabaseReminder } from '@/hooks/useSupabaseData';
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
  supabaseOperations
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

  // Convert userTasks to format expected by RemindersList
  const convertedUpcomingTasks = upcomingTasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    estimated_time: task.estimated_time,
    difficulty: task.difficulty,
    estimated_budget: task.estimated_budget,
    due_date: task.due_date,
    isPastDue: task.isPastDue,
    assignedToNames: task.assignedToNames,
    status: task.status,
    last_completed: task.last_completed,
    next_due: task.due_date
  }));

  // Convert for calendar view - create mock reminders that match the expected interface
  const convertedCalendarReminders = upcomingTasks.map(task => ({
    id: task.id,
    user_id: task.user_id,
    reminder_id: task.reminder_id,
    title: task.title,
    description: task.description,
    difficulty: task.difficulty,
    estimated_time: task.estimated_time,
    estimated_budget: task.estimated_budget,
    frequency_days: task.frequency_days,
    due_date: task.due_date,
    last_completed: task.last_completed,
    status: task.status,
    video_url: task.video_url,
    instructions: task.instructions,
    tools: task.tools,
    supplies: task.supplies,
    reminder_type: task.reminder_type,
    is_custom: task.is_custom,
    created_at: task.created_at,
    assignees: task.assignees,
    assignedToNames: task.assignedToNames,
    isPastDue: task.isPastDue,
    // Add missing properties for SupabaseReminder compatibility
    frequency: 'monthly',
    enabled: true,
    updated_at: task.created_at,
    family_id: null,
    completed_date: task.last_completed
  }));

  const convertedCalendarTasks = upcomingTasks.map(task => ({
    title: task.title,
    description: task.description,
    estimatedTime: task.estimated_time,
    difficulty: task.difficulty as 'Easy' | 'Medium' | 'Hard',
    dueDate: task.due_date || 'Not set',
  }));

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
            upcomingTasks={convertedUpcomingTasks}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
          />
        ) : (
          <ReminderCalendarView
            tasks={convertedCalendarTasks}
            reminders={convertedCalendarReminders}
            onTaskClick={handleTaskClick}
            onTaskComplete={handleTaskComplete}
            familyMembers={familyMembers}
            supabaseOperations={supabaseOperations}
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
        supabaseOperations={supabaseOperations}
      />

      <CompletedTasksButton onNavigateToCompleted={onNavigateToCompleted} />
    </div>
  );
};

export default RemindersView;
