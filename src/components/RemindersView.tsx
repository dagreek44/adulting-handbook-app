
import ReminderEditMode from '@/components/ReminderEditMode';
import ReminderCalendarView from '@/components/ReminderCalendarView';
import AddCustomReminder from '@/components/AddCustomReminder';
import ReminderLoadingState from '@/components/ReminderLoadingState';
import RemindersHeader from '@/components/RemindersHeader';
import ReminderViewToggle from '@/components/ReminderViewToggle';
import RemindersList from '@/components/RemindersList';
import CompletedTasksButton from '@/components/CompletedTasksButton';
import GlobalRemindersSelector from '@/components/GlobalRemindersSelector';
import CategoryFilter from '@/components/CategoryFilter';
import { FamilyMember, SupabaseReminder } from '@/hooks/useSupabaseData';
import { useReminders, UserTask as ContextUserTask, GlobalReminder } from '@/contexts/ReminderContext';
import { UserTaskService } from '@/services/UserTaskService';
import { useState } from 'react';

interface TaskDetails {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: string;
  estimatedBudget: string;
  dueDate: string;
  videoUrl?: string;
  instructions: string[];
  tools: string[];
  supplies: string[];
  isGlobalReminder: boolean;
}

interface RemindersViewProps {
  allReminders: SupabaseReminder[];
  familyMembers: FamilyMember[];
  setFamilyMembers: (members: FamilyMember[]) => void;
  completedTasks: number;
  onTaskComplete: (task?: ContextUserTask) => void;
  selectedTask: TaskDetails | null;
  setSelectedTask: (task: TaskDetails | null) => void;
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
  const { userTasks, globalReminders, loading, markTaskCompleted, enableReminder, addCustomTask } = useReminders();
  
  // Category filtering state
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  // Filter to show only pending tasks (not completed ones)
  const pendingTasks = userTasks.filter(task => task.status !== 'completed');
  
  // Get only the next 3 upcoming tasks
  const upcomingTasks = pendingTasks.slice(0, 3);

  const handleTaskClick = (task: ContextUserTask) => {
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
      supplies: task.supplies || [],
      isGlobalReminder: !!task.reminder_id
    };
    setSelectedTask(taskDetails);
    setIsModalOpen(true);
  };

  const handleTaskComplete = async (task: ContextUserTask) => {
    try {
      await markTaskCompleted(task.id);
      await onTaskComplete(task);
    } catch (error) {
      console.error('Failed to complete task:', error);
    }
  };

  const handleEnableReminder = async (globalReminder: GlobalReminder) => {
    try {
      console.log('Enabling reminder:', globalReminder);
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
    next_due: task.due_date,
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

  // Create wrapper functions to handle type conversions
  const handleReminderListTaskClick = (task: any) => {
    // Find the original task to get complete data
    const originalTask = upcomingTasks.find(t => t.id === task.id);
    if (originalTask) {
      handleTaskClick(originalTask);
    }
  };

  const handleReminderListTaskComplete = async (task: any) => {
    // Find the original task to get complete data
    const originalTask = upcomingTasks.find(t => t.id === task.id);
    if (originalTask) {
      await handleTaskComplete(originalTask);
    }
  };

  const handleCalendarTaskClick = (task: any) => {
    // For calendar tasks, try to find matching task in upcomingTasks
    if ('id' in task) {
      const originalTask = upcomingTasks.find(t => t.id === task.id);
      if (originalTask) {
        handleTaskClick(originalTask);
      }
    }
  };

  const handleCalendarTaskComplete = () => {
    // Calendar view doesn't pass task data, so we handle completion differently
    console.log('Task completed from calendar view');
  };

  // Get reminder IDs that are already enabled for this user
  const enabledReminderIds = userTasks
    .filter(task => task.reminder_id) // Only tasks that come from global reminders
    .map(task => task.reminder_id);

  // Wrapper function to match AddCustomReminder's expected signature
  const handleAddUserTask = async (userId: string, task: Partial<ContextUserTask>) => {
    await addCustomTask(task);
  };

  // Category management
  const getCategories = () => {
    const categories: Record<string, Set<string>> = {};
    
    globalReminders.forEach(reminder => {
      const mainCategory = reminder.main_category || 'Household';
      const subcategory = reminder.subcategory || 'General';
      
      if (!categories[mainCategory]) {
        categories[mainCategory] = new Set();
      }
      categories[mainCategory].add(subcategory);
    });
    
    // Convert Sets to arrays
    return Object.fromEntries(
      Object.entries(categories).map(([key, value]) => [key, Array.from(value)])
    );
  };

  const handleCategoryToggle = (categoryKey: string) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryKey)) {
      newSelected.delete(categoryKey);
    } else {
      newSelected.add(categoryKey);
    }
    setSelectedCategories(newSelected);
  };

  const handleClearFilters = () => {
    setSelectedCategories(new Set());
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
            upcomingTasks={convertedUpcomingTasks}
            onTaskClick={handleReminderListTaskClick}
            onTaskComplete={handleReminderListTaskComplete}
          />
        ) : (
          <ReminderCalendarView
            tasks={convertedCalendarTasks}
            reminders={convertedCalendarReminders}
            onTaskClick={handleCalendarTaskClick}
            onTaskComplete={handleCalendarTaskComplete}
            familyMembers={familyMembers}
            supabaseOperations={supabaseOperations}
          />
        )}
      </ReminderLoadingState>

      {/* Only show GlobalRemindersSelector and CategoryFilter in edit mode */}
      {isEditMode && (
        <>
          <CategoryFilter
            categories={getCategories()}
            selectedCategories={selectedCategories}
            onCategoryToggle={handleCategoryToggle}
            onClearFilters={handleClearFilters}
          />
          <GlobalRemindersSelector
            globalReminders={globalReminders}
            enabledTaskIds={enabledReminderIds}
            onEnableReminder={handleEnableReminder}
            selectedCategories={selectedCategories}
          />
        </>
      )}

      <AddCustomReminder
        familyMembers={familyMembers}
        supabaseOperations={{
          ...supabaseOperations,
          addUserTask: handleAddUserTask
        }}
      />

      <CompletedTasksButton onNavigateToCompleted={onNavigateToCompleted} />
    </div>
  );
};

export default RemindersView;
