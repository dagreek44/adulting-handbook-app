
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

// The detailed info for standard tasks
const detailedTasks = [
  {
    title: "Change Furnace Filter",
    description: "Replace the HVAC filter to improve air quality and system efficiency",
    estimatedTime: "15 min",
    difficulty: "Easy" as const,
    dueDate: "In 3 days",
    videoUrl: "https://youtube.com/watch?v=example1",
    instructions: [
      "Turn off your HVAC system at the thermostat",
      "Locate the air filter compartment (usually near the return air duct)",
      "Remove the old filter and note the airflow direction arrows",
      "Insert the new filter with arrows pointing toward the unit",
      "Close the compartment and turn the system back on"
    ],
    tools: [
      { name: "Flashlight", required: false },
      { name: "Screwdriver", required: false, amazonUrl: "https://amazon.com/screwdriver" }
    ],
    supplies: [
      { name: "HVAC Filter (16x25x1)", amazonUrl: "https://amazon.com/hvac-filter", estimatedCost: "$8-15" },
      { name: "Disposable Gloves", amazonUrl: "https://amazon.com/gloves", estimatedCost: "$5-10" }
    ]
  },
  {
    title: "Clean Gutters",
    description: "Remove debris and check for proper drainage to prevent water damage",
    estimatedTime: "2 hours",
    difficulty: "Medium" as const,
    dueDate: "Next week",
    videoUrl: "https://youtube.com/watch?v=example2",
    instructions: [
      "Set up a sturdy ladder on level ground",
      "Remove large debris by hand",
      "Use a garden hose to flush remaining debris",
      "Check downspouts for clogs",
      "Inspect gutters for damage or loose connections"
    ],
    tools: [
      { name: "Extension Ladder", required: true },
      { name: "Garden Hose", required: true },
      { name: "Gutter Scoop", required: false, amazonUrl: "https://amazon.com/gutter-scoop" }
    ],
    supplies: [
      { name: "Work Gloves", amazonUrl: "https://amazon.com/work-gloves", estimatedCost: "$10-20" },
      { name: "Trash Bags", amazonUrl: "https://amazon.com/trash-bags", estimatedCost: "$8-15" }
    ]
  },
  {
    title: "Test Smoke Detectors",
    description: "Check batteries and test alarm functionality for home safety",
    estimatedTime: "30 min",
    difficulty: "Easy" as const,
    dueDate: "This weekend",
    videoUrl: "https://youtube.com/watch?v=example3",
    instructions: [
      "Press and hold the test button on each detector",
      "Listen for a loud, clear alarm sound",
      "Replace batteries if alarm is weak or doesn't sound",
      "Test again after battery replacement",
      "Record the test date for your records"
    ],
    tools: [
      { name: "Step Ladder", required: true },
      { name: "Battery Tester", required: false, amazonUrl: "https://amazon.com/battery-tester" }
    ],
    supplies: [
      { name: "9V Batteries (4-pack)", amazonUrl: "https://amazon.com/9v-batteries", estimatedCost: "$12-18" }
    ]
  }
];

const getTaskDetails = (reminder: Reminder) => {
  // Try to find details for standard tasks
  const standard = detailedTasks.find(task => task.title === reminder.title);
  return {
    estimatedTime: standard?.estimatedTime ?? "30 min",
    difficulty: standard?.difficulty ?? "Easy",
    dueDate: standard?.dueDate ?? (reminder.date ? reminder.date.toLocaleDateString() : "Set date"),
    // All the extras for the modal
    description: standard?.description ?? reminder.description,
    videoUrl: standard?.videoUrl,
    instructions: standard?.instructions ?? [],
    tools: standard?.tools ?? [],
    supplies: standard?.supplies ?? [],
  };
};

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

  // When you click a task, merge in all details before opening modal
  const handleTaskClick = (reminder: Reminder) => {
    const details = getTaskDetails(reminder);
    setSelectedTask({
      ...reminder,
      ...details,
    });
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
              {upcomingTasks.map((reminder, index) => {
                const details = getTaskDetails(reminder);
                return (
                  <TaskCard
                    key={reminder.id}
                    title={reminder.title}
                    description={details.description}
                    estimatedTime={details.estimatedTime}
                    difficulty={details.difficulty}
                    dueDate={details.dueDate}
                    isCompleted={false}
                    onComplete={onTaskComplete}
                    onClick={() => handleTaskClick(reminder)}
                  />
                );
              })}
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
          tasks={upcomingTasks.map(reminder => {
            const details = getTaskDetails(reminder);
            return {
              title: reminder.title,
              description: details.description,
              estimatedTime: details.estimatedTime,
              difficulty: details.difficulty,
              dueDate: details.dueDate,
            };
          })}
          onTaskClick={handleTaskClick}
          onTaskComplete={onTaskComplete}
        />
      )}
    </div>
  );
};
export default RemindersView;

