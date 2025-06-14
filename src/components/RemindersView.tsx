
import { useState } from 'react';
import ReminderEditMode from '@/components/ReminderEditMode';
import ReminderCalendarView from '@/components/ReminderCalendarView';
import TaskCard from '@/components/TaskCard';
import { Users, Edit, CalendarDays, List, Flame, House, Wrench, Star } from 'lucide-react';

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Member';
}

interface Reminder {
  id: string;
  title: string;
  description: string;
  frequency: string;
  enabled: boolean;
  isCustom?: boolean;
  date?: Date | null;
  assignees?: string[];
}

interface RemindersViewProps {
  reminders: Reminder[];
  setReminders: (reminders: Reminder[]) => void;
  familyMembers: FamilyMember[];
  setFamilyMembers: (members: FamilyMember[]) => void;
  completedTasks: number;
  onTaskComplete: () => void;
  selectedTask: any;
  setSelectedTask: (task: any) => void;
  setIsModalOpen: (b: boolean) => void;
  isEditMode: boolean;
  setIsEditMode: (b: boolean) => void;
  reminderViewMode: 'list' | 'calendar';
  setReminderViewMode: (m: 'list' | 'calendar') => void;
  isFamilyModalOpen: boolean;
  setIsFamilyModalOpen: (b: boolean) => void;
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
}: RemindersViewProps) => {
  // Filter out upcoming standard and custom tasks and combine
  const upcomingTasks = reminders.filter(r => r.enabled);
  // Simple mock: If more logic needed you may add detailed task data and join by title

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
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
        <>
          <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Upcoming Tasks</h3>
            <div className="space-y-4">
              {upcomingTasks.map((task, index) => (
                <TaskCard
                  key={index}
                  {...task}
                  onComplete={onTaskComplete}
                  onClick={() => handleTaskClick(task)}
                />
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Task Categories</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-sage/10 p-3 rounded-lg text-center">
                <Flame className="w-6 h-6 text-sage mx-auto mb-2" />
                <p className="text-sm font-medium text-sage">HVAC</p>
              </div>
              <div className="bg-blue-soft/20 p-3 rounded-lg text-center">
                <House className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-blue-600">General</p>
              </div>
              <div className="bg-coral/20 p-3 rounded-lg text-center">
                <Wrench className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-orange-600">Plumbing</p>
              </div>
              <div className="bg-earth/20 p-3 rounded-lg text-center">
                <Star className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-yellow-600">Seasonal</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <ReminderCalendarView
          tasks={upcomingTasks}
          onTaskClick={handleTaskClick}
          onTaskComplete={onTaskComplete}
        />
      )}
    </div>
  );
};
export default RemindersView;
