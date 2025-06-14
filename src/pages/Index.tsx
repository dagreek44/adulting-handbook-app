import { useState } from 'react';
import { Wrench, Flame, House, Star, Calendar, Trophy, Edit, Users, CalendarDays, List } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import DashboardCard from '@/components/DashboardCard';
import Navigation from '@/components/Navigation';
import TaskCard from '@/components/TaskCard';
import ContractorCard from '@/components/ContractorCard';
import AchievementBadge from '@/components/AchievementBadge';
import TaskDetailModal from '@/components/TaskDetailModal';
import ReminderEditMode from '@/components/ReminderEditMode';
import ReminderCalendarView from '@/components/ReminderCalendarView';
import FamilyMembersModal from '@/components/FamilyMembersModal';
import RemindersView from "@/components/RemindersView";
import ContractorsView from "@/components/ContractorsView";

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

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [completedTasks, setCompletedTasks] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [reminderViewMode, setReminderViewMode] = useState<'list' | 'calendar'>('list');
  const { toast } = useToast();

  const [reminders, setReminders] = useState<Reminder[]>([
    { id: '1', title: 'Change Furnace Filter', description: 'Monthly filter replacement', frequency: 'monthly', enabled: true, date: null, assignees: [] },
    { id: '2', title: 'Clean Gutters', description: 'Seasonal gutter maintenance', frequency: 'seasonally', enabled: true, date: null, assignees: [] },
    { id: '3', title: 'Test Smoke Detectors', description: 'Monthly safety check', frequency: 'monthly', enabled: true, date: null, assignees: [] },
  ]);

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    { id: '1', name: 'You', email: 'you@example.com', role: 'Admin' as const },
  ]);

  const handleTaskComplete = () => {
    setCompletedTasks(prev => prev + 1);
    toast({
      title: "Great job! 🎉",
      description: "You're one step closer to mastering adulting!",
      duration: 3000,
    });
  };

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

  const upcomingTasks = detailedTasks.filter(task => 
    reminders.find(r => r.title === task.title)?.enabled
  );

  const contractors = [
    {
      name: "Mike's HVAC",
      specialty: "Heating & Cooling",
      rating: 4.8,
      location: "2.3 miles",
      priceRange: "150-300",
      completedJobs: 127
    },
    {
      name: "Sarah's Handywork",
      specialty: "General Repairs",
      rating: 4.9,
      location: "1.8 miles",
      priceRange: "80-200",
      completedJobs: 203
    },
    {
      name: "Pro Plumbing Co.",
      specialty: "Plumbing Services",
      rating: 4.7,
      location: "3.1 miles",
      priceRange: "120-250",
      completedJobs: 89
    }
  ];

  const achievements = [
    {
      title: "First Timer",
      description: "Completed your first home maintenance task",
      level: 1,
      isUnlocked: completedTasks >= 1,
      category: "maintenance" as const,
      progress: Math.min(completedTasks * 100, 100)
    },
    {
      title: "DIY Rookie",
      description: "Completed 5 maintenance tasks on your own",
      level: 2,
      isUnlocked: completedTasks >= 5,
      category: "diy" as const,
      progress: Math.min((completedTasks / 5) * 100, 100)
    },
    {
      title: "Pro Helper",
      description: "Hired your first professional contractor",
      level: 1,
      isUnlocked: false,
      category: "contractor" as const,
      progress: 0
    }
  ];

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <DashboardCard
                title="Upcoming Tasks"
                subtitle={`${upcomingTasks.length} items due soon`}
                icon={Calendar}
                color="bg-gradient-to-br from-blue-soft to-blue-400"
                onClick={() => setActiveTab('reminders')}
                badge={upcomingTasks.length}
              />
              <DashboardCard
                title="Find Help"
                subtitle="Browse contractors"
                icon={Wrench}
                color="bg-gradient-to-br from-coral to-orange-400"
                onClick={() => setActiveTab('contractors')}
              />
              <DashboardCard
                title="Achievements"
                subtitle="Level up your skills"
                icon={Trophy}
                color="bg-gradient-to-br from-sage to-sage-light"
                onClick={() => setActiveTab('achievements')}
              />
              <DashboardCard
                title="Home Health"
                subtitle="System checkups"
                icon={House}
                color="bg-gradient-to-br from-earth to-yellow-600"
                onClick={() => {}}
              />
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Achievements</h3>
              <div className="grid grid-cols-1 gap-3">
                {achievements.slice(0, 2).map((achievement, index) => (
                  <AchievementBadge key={index} {...achievement} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h3>
              <div className="bg-white p-4 rounded-xl shadow-md">
                <div className="space-y-3">
                  <button className="w-full bg-sage text-white py-3 rounded-lg font-medium hover:bg-sage/90 transition-colors">
                    🔧 Schedule Home Inspection
                  </button>
                  <button className="w-full bg-blue-soft text-white py-3 rounded-lg font-medium hover:bg-blue-400 transition-colors">
                    📅 Set Seasonal Reminders
                  </button>
                  <button className="w-full bg-coral text-white py-3 rounded-lg font-medium hover:bg-orange-400 transition-colors">
                    🛒 Shop for Supplies
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reminders':
        return (
          <RemindersView
            reminders={reminders}
            setReminders={setReminders}
            familyMembers={familyMembers}
            setFamilyMembers={setFamilyMembers}
            completedTasks={completedTasks}
            onTaskComplete={handleTaskComplete}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            setIsModalOpen={setIsModalOpen}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
            reminderViewMode={reminderViewMode}
            setReminderViewMode={setReminderViewMode}
            isFamilyModalOpen={isFamilyModalOpen}
            setIsFamilyModalOpen={setIsFamilyModalOpen}
          />
        );

      case 'contractors':
        return <ContractorsView />;

      case 'achievements':
        return (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Your Badges</h3>
              <div className="grid grid-cols-1 gap-4">
                {achievements.map((achievement, index) => (
                  <AchievementBadge key={index} {...achievement} />
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-soft to-blue-400 p-4 rounded-xl text-white">
              <h3 className="text-lg font-bold mb-2">Level Up! 🚀</h3>
              <p className="text-sm mb-4 opacity-90">
                Complete more tasks and hire contractors to unlock new achievements and improve your adulting level.
              </p>
              <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-300"
                  style={{ width: `${(completedTasks / 10) * 100}%` }}
                />
              </div>
              <p className="text-xs mt-2 opacity-90">
                {completedTasks}/10 tasks to next level
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
        <Header />
        
        <div className="p-4 pb-20">
          {renderContent()}
        </div>

        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md">
          <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <TaskDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          task={selectedTask}
          onComplete={handleTaskComplete}
        />

        <FamilyMembersModal
          isOpen={isFamilyModalOpen}
          onClose={() => setIsFamilyModalOpen(false)}
          familyMembers={familyMembers}
          onUpdateMembers={setFamilyMembers}
        />
      </div>
    </div>
  );
};

export default Index;
