import ReminderEditMode from '@/components/ReminderEditMode';
import AddCustomReminder from '@/components/AddCustomReminder';
import ReminderLoadingState from '@/components/ReminderLoadingState';
import RemindersHeader from '@/components/RemindersHeader';
import RemindersList from '@/components/RemindersList';
import RemindersFilter from '@/components/RemindersFilter';
import CompletedTasksButton from '@/components/CompletedTasksButton';
import { FamilyMember, SupabaseReminder } from '@/hooks/useSupabaseData';
import { useReminders, UserTask as ContextUserTask, GlobalReminder } from '@/contexts/ReminderContext';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import TaskDetailModal from './TaskDetailModal';
import { PlusCircle, MinusCircle } from 'lucide-react';
import { PushNotificationService } from '@/services/PushNotificationService';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
  familyMembers: FamilyMember[];
  setFamilyMembers: (members: FamilyMember[]) => void;
  completedTasks: number;
  onTaskComplete: (task?: ContextUserTask) => void;
  selectedTask: TaskDetails | null;
  setSelectedTask: (task: TaskDetails | null) => void;
  setIsModalOpen: (b: boolean) => void;
  isEditMode: boolean;
  setIsEditMode: (b: boolean) => void;
  isFamilyModalOpen: boolean;
  setIsFamilyModalOpen: (b: boolean) => void;
  onNavigateToCompleted: () => void;
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
  isFamilyModalOpen,
  setIsFamilyModalOpen,
  onNavigateToCompleted,
}: RemindersViewProps) => {
  const { userTasks, globalReminders, loading, markTaskCompleted, enableReminder, addCustomTask, postponeTask, updateTask, refreshTasks } = useReminders();
  const { user } = useAuth();
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const pendingTasks = userTasks.filter(task =>
    task.status !== 'completed' && 
    task.enabled !== false &&
    !task.completed_date
  );
  
  const availableSources = useMemo(() => {
    const sources: { id: string; label: string }[] = [
      { id: 'family', label: 'Family' },
    ];
    const groupNames = new Set<string>();
    userTasks.forEach(task => {
      if ((task as any).source === 'friend_group' && (task as any).sourceGroupName) {
        groupNames.add((task as any).sourceGroupName);
      }
    });
    groupNames.forEach(name => {
      sources.push({ id: `group:${name}`, label: name });
    });
    return sources;
  }, [userTasks]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    userTasks.forEach(task => {
      if (task.reminder_type === 'global') cats.add('Global');
      if (task.reminder_type === 'custom' || task.is_custom) cats.add('Custom');
    });
    return Array.from(cats);
  }, [userTasks]);
  
  const filteredTasks = useMemo(() => {
    let tasks = pendingTasks;
    
    if (selectedCategories.length > 0) {
      tasks = tasks.filter(task => {
        if (selectedCategories.includes('Global') && task.reminder_type === 'global') return true;
        if (selectedCategories.includes('Custom') && (task.reminder_type === 'custom' || task.is_custom)) return true;
        return false;
      });
    }
    
    if (selectedSources.length > 0) {
      tasks = tasks.filter(task => {
        const taskAny = task as any;
        if (selectedSources.includes('family') && taskAny.source === 'family') return true;
        if (taskAny.source === 'friend_group' && selectedSources.includes(`group:${taskAny.sourceGroupName}`)) return true;
        return false;
      });
    }
    
    if (selectedMembers.length > 0) {
      tasks = tasks.filter(task => selectedMembers.includes(task.user_id));
    }
    
    return tasks;
  }, [pendingTasks, selectedCategories, selectedMembers, selectedSources]);
  
  const upcomingTasks = filteredTasks;
  
  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedMembers([]);
    setSelectedSources([]);
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
      const task = userTasks.find(t => t.id === taskId);
      await updateTask(taskId, { user_id: newUserId });
      
      if (newUserId !== user?.id && task) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user?.id)
          .single();
        
        const reassignerName = profile?.first_name 
          ? `${profile.first_name} ${profile.last_name || ''}`.trim()
          : user?.email?.split('@')[0] || 'A family member';
        
        await PushNotificationService.notifyReminderReassigned(
          newUserId,
          reassignerName,
          task.title,
          taskId
        );
      }
      
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
      await enableReminder(globalReminder);
    } catch (error) {
      console.error('Failed to enable reminder:', error);
    }
  };

  const convertedUpcomingTasks = upcomingTasks.map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    estimated_time: task.estimated_time,
    difficulty: task.difficulty,
    estimated_budget: task.estimated_budget,
    due_date: task.due_date,
    isPastDue: task.isPastDue,
    // CRITICAL FIX: Ensure assignedToNames is passed correctly from the task object
    assignedToNames: task.assignedToNames || [],
    status: task.status,
    last_completed: task.last_completed,
    next_due: task.due_date,
    why: task.why,
    isGlobalReminder: !!task.reminder_id
  }));

  const handleReminderListTaskClick = (task: any) => {
    const originalTask = upcomingTasks.find(t => t.id === task.id);
    if (originalTask) {
      handleTaskClick(originalTask);
    }
  };

  const handleReminderListTaskComplete = async (task: any) => {
    const originalTask = upcomingTasks.find(t => t.id === task.id);
    if (originalTask) {
      await handleTaskComplete(originalTask);
    }
  };

  const handlePostponeTask = async (taskId: string, newDate: Date) => {
    await postponeTask(taskId, newDate);
  };

  const addCustomTaskWrapper = async (task: Partial<ContextUserTask>) => {
    if (user?.id) {
      await addCustomTask(task);
    }
  };

  return (
    <div className="space-y-6">
      <RemindersHeader
        setIsFamilyModalOpen={setIsFamilyModalOpen}
      />

      <RemindersFilter
        categories={categories}
        familyMembers={familyMembers}
        selectedCategories={selectedCategories}
        selectedMembers={selectedMembers}
        selectedSources={selectedSources}
        availableSources={availableSources}
        onCategoryChange={setSelectedCategories}
        onMemberChange={setSelectedMembers}
        onSourceChange={setSelectedSources}
        onClearFilters={clearFilters}
      />

      <ReminderLoadingState loading={loading} reminders={pendingTasks}>
        <RemindersList
          upcomingTasks={convertedUpcomingTasks}
          onTaskClick={handleReminderListTaskClick}
          onTaskComplete={handleReminderListTaskComplete}
          onPostpone={handlePostponeTask}
        />
      </ReminderLoadingState>

      <div className="bg-white p-4 rounded-xl shadow-md" data-tour="edit-reminders">
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
              +/- Adulting Reminders
            </>
          )}
        </button>
      </div>

      {isEditMode && (
        <ReminderEditMode
          isEditMode={isEditMode}
          onExitEdit={() => setIsEditMode(false)}
          globalReminders={globalReminders}
          familyMembers={familyMembers}
        />
      )}

      <AddCustomReminder familyMembers={familyMembers} />

      <CompletedTasksButton onNavigateToCompleted={onNavigateToCompleted} />

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
