import ReminderEditMode from '@/components/ReminderEditMode';
import ReminderCalendarView from '@/components/ReminderCalendarView';
import AddCustomReminder from '@/components/AddCustomReminder';
import ReminderLoadingState from '@/components/ReminderLoadingState';
import RemindersHeader from '@/components/RemindersHeader';
import ReminderViewToggle from '@/components/ReminderViewToggle';
import RemindersList from '@/components/RemindersList';
import RemindersFilter from '@/components/RemindersFilter';
import CompletedTasksButton from '@/components/CompletedTasksButton';
import { FamilyMember, SupabaseReminder } from '@/hooks/useSupabaseData';
import { useReminders, UserTask as ContextUserTask, GlobalReminder } from '@/contexts/ReminderContext';
import { UserTaskService } from '@/services/UserTaskService';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import TaskDetailModal from './TaskDetailModal';
import { PlusCircle, MinusCircle } from 'lucide-react';

interface TaskDetails {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedBudget: string;
  dueDate: string;
  videoUrl?: string;
  instructions: string[];
  tools: string[];
  supplies: string[];
  isGlobalReminder: boolean;
  user_id?: string;
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
  // Use the new reminder context
  const { userTasks, globalReminders, loading, markTaskCompleted, enableReminder, addCustomTask, postponeTask, updateTask, refreshTasks } = useReminders();
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  
  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Filter to show only pending/enabled tasks (not completed ones or disabled "once" tasks)
  const pendingTasks = userTasks.filter(task => 
    task.status !== 'completed' && 
    task.enabled !== false && // Exclude disabled tasks (completed "once" tasks)
    !task.completed_date // Exclude tasks that have been completed
  );
  
  // Extract unique categories from tasks
  const categories = useMemo(() => {
    const cats = new Set<string>();
    userTasks.forEach(task => {
      if (task.reminder_type === 'global') cats.add('Global');
      if (task.reminder_type === 'custom' || task.is_custom) cats.add('Custom');
    });
    return Array.from(cats);
  }, [userTasks]);
  
  // Apply filters to tasks
  const filteredTasks = useMemo(() => {
    let tasks = pendingTasks;
    
    // Filter by category
    if (selectedCategories.length > 0) {
      tasks = tasks.filter(task => {
        if (selectedCategories.includes('Global') && task.reminder_type === 'global') return true;
        if (selectedCategories.includes('Custom') && (task.reminder_type === 'custom' || task.is_custom)) return true;
        return false;
      });
    }
    
    // Filter by family member
    if (selectedMembers.length > 0) {
      tasks = tasks.filter(task => selectedMembers.includes(task.user_id));
    }
    
    return tasks;
  }, [pendingTasks, selectedCategories, selectedMembers]);
  
  // Show all upcoming tasks (sorted by due date already from service)
  const upcomingTasks = filteredTasks;
  
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedMembers([]);
  };

  const handleTaskClick = (task: ContextUserTask) => {
    const taskDetails = {
      id: task.id,
      title: task.title,
      description: task.description,
      estimatedTime: task.estimated_time,
      difficulty: (task.difficulty || 'Easy') as 'Easy' | 'Medium' | 'Hard',
      estimatedBudget: task.estimated_budget,
      dueDate: task.due_date || 'Not set',
      videoUrl: task.video_url,
      instructions: task.instructions || [],
      tools: task.tools || [],
      supplies: task.supplies || [],
      isGlobalReminder: !!task.reminder_id,
      user_id: task.user_id
    };
    setSelectedTask(taskDetails);
    setIsTaskDetailOpen(true);
  };

  const handleReassignTask = async (taskId: string, newUserId: string) => {
    try {
      await updateTask(taskId, { user_id: newUserId });
      await refreshTasks();
      toast.success('Task reassigned successfully');
    } catch (error) {
      console.error('Failed to reassign task:', error);
      toast.error('Failed to reassign task');
      throw error;
    }
  };

  const handleUpdateDueDate = async (taskId: string, newDate: Date) => {
    try {
      const formattedDate = newDate.toISOString().split('T')[0];
      await updateTask(taskId, { due_date: formattedDate });
      await refreshTasks();
      toast.success('Due date updated successfully');
    } catch (error) {
      console.error('Failed to update due date:', error);
      toast.error('Failed to update due date');
      throw error;
    }
  };

  const handleTaskDetailComplete = async () => {
    if (selectedTask) {
      const task = upcomingTasks.find(t => t.id === selectedTask.id);
      if (task) {
        await handleTaskComplete(task);
        setIsTaskDetailOpen(false);
      }
    }
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

  const handlePostponeTask = async (taskId: string, newDate: Date) => {
    await postponeTask(taskId, newDate);
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

  return (
    <div className="space-y-6">
      <RemindersHeader
        setIsFamilyModalOpen={setIsFamilyModalOpen}
      />

      <ReminderViewToggle
        reminderViewMode={reminderViewMode}
        setReminderViewMode={setReminderViewMode}
      />

      {/* Filters - only show in list view */}
      {reminderViewMode === 'list' && (
        <RemindersFilter
          categories={categories}
          familyMembers={familyMembers}
          selectedCategories={selectedCategories}
          selectedMembers={selectedMembers}
          onCategoryChange={setSelectedCategories}
          onMemberChange={setSelectedMembers}
          onClearFilters={clearFilters}
        />
      )}

      <ReminderLoadingState loading={loading} reminders={pendingTasks}>
        {reminderViewMode === 'list' ? (
          <RemindersList
            upcomingTasks={convertedUpcomingTasks}
            onTaskClick={handleReminderListTaskClick}
            onTaskComplete={handleReminderListTaskComplete}
            onPostpone={handlePostponeTask}
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

      {/* +/- Adult Reminders button */}
      <div className="bg-white p-4 rounded-xl shadow-md">
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center ${
            isEditMode
              ? 'bg-sage text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isEditMode ? (
            <>
              <MinusCircle className="w-5 h-5 mr-2" />
              Done Managing Reminders
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5 mr-2" />
              +/- Adult Reminders
            </>
          )}
        </button>
      </div>

      {/* Show ReminderEditMode when in edit mode */}
      {isEditMode && (
        <ReminderEditMode
          isEditMode={isEditMode}
          onExitEdit={() => setIsEditMode(false)}
          allReminders={allReminders}
          globalReminders={globalReminders}
          familyMembers={familyMembers}
          supabaseOperations={supabaseOperations}
        />
      )}

      <AddCustomReminder
        familyMembers={familyMembers}
        supabaseOperations={{
          ...supabaseOperations,
          addUserTask: handleAddUserTask
        }}
      />

      <CompletedTasksButton onNavigateToCompleted={onNavigateToCompleted} />

      {/* Task Detail Modal with assignment and due date features */}
      <TaskDetailModal
        isOpen={isTaskDetailOpen}
        onClose={() => setIsTaskDetailOpen(false)}
        task={selectedTask}
        onComplete={handleTaskDetailComplete}
        familyMembers={familyMembers}
        onReassign={handleReassignTask}
        onUpdateDueDate={handleUpdateDueDate}
      />
    </div>
  );
};

export default RemindersView;
