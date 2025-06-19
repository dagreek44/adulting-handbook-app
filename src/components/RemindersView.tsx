
import { useState } from 'react';
import ReminderEditMode from '@/components/ReminderEditMode';
import ReminderCalendarView from '@/components/ReminderCalendarView';
import TaskCard from '@/components/TaskCard';
import AddCustomReminder from '@/components/AddCustomReminder';
import { Users, Edit, CalendarDays, List, CheckCircle2 } from 'lucide-react';
import { UserTask, FamilyMember } from '@/hooks/useSupabaseData';

interface RemindersViewProps {
  reminders: UserTask[];
  setReminders: (reminders: UserTask[]) => void;
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
    addReminder: (reminder: Partial<UserTask>) => Promise<void>;
    updateReminder: (id: string, updates: Partial<UserTask>) => Promise<void>;
    deleteReminder: (id: string) => Promise<void>;
  };
}

const RemindersView = ({
  reminders,
  setReminders,
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
  // Get only the next 3 upcoming tasks
  const upcomingTasks = reminders.slice(0, 3);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Reminders</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsFamilyModalOpen(true)}
            className="flex items-center px-3 py-2 bg-blue-soft text-white rounded-lg hover:bg-blue-400 transition-colors"
          >
            <Users className="w-4 h-4 mr-2" />
            Family
          </button>
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              isEditMode 
                ? 'bg-sage text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Edit className="w-4 h-4 mr-2" />
            {isEditMode ? 'Done' : 'Edit'}
          </button>
        </div>
      </div>

      <ReminderEditMode
        isEditMode={isEditMode}
        onExitEdit={() => setIsEditMode(false)}
        reminders={reminders}
        onUpdateReminders={setReminders}
        familyMembers={familyMembers}
        supabaseOperations={supabaseOperations}
      />

      {/* View Toggle */}
      <div className="flex bg-white p-1 rounded-lg shadow-md">
        <button
          onClick={() => setReminderViewMode('list')}
          className={`flex items-center flex-1 py-2 px-4 rounded-md transition-colors ${
            reminderViewMode === 'list' 
              ? 'bg-sage text-white' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <List className="w-4 h-4 mr-2" />
          List View
        </button>
        <button
          onClick={() => setReminderViewMode('calendar')}
          className={`flex items-center flex-1 py-2 px-4 rounded-md transition-colors ${
            reminderViewMode === 'calendar' 
              ? 'bg-sage text-white' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          Calendar View
        </button>
      </div>

      {reminderViewMode === 'list' ? (
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
                isCompleted={false}
                onComplete={() => onTaskComplete(reminder)}
                onClick={() => handleTaskClick(reminder)}
              />
            ))}
            {upcomingTasks.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No upcoming tasks. Great job!</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <ReminderCalendarView
          tasks={upcomingTasks.map(reminder => ({
            title: reminder.title,
            description: reminder.description,
            estimatedTime: reminder.estimated_time,
            difficulty: reminder.difficulty as 'Easy' | 'Medium' | 'Hard',
            dueDate: reminder.due_date || 'Not set',
          }))}
          reminders={reminders}
          onTaskClick={handleTaskClick}
          onTaskComplete={onTaskComplete}
          familyMembers={familyMembers}
          supabaseOperations={supabaseOperations}
        />
      )}

      {/* Always show Add Custom Reminder */}
      <AddCustomReminder
        familyMembers={familyMembers}
        supabaseOperations={supabaseOperations}
      />

      {/* Button to navigate to completed tasks */}
      <button
        onClick={onNavigateToCompleted}
        className="w-full bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition-colors flex items-center justify-center"
      >
        <CheckCircle2 className="w-5 h-5 mr-2" />
        View Recently Completed Tasks
      </button>
    </div>
  );
};

export default RemindersView;
