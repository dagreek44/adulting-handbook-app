
import { useState } from 'react';
import { Wrench, Flame, House, Star, Calendar, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import DashboardCard from '@/components/DashboardCard';
import Navigation from '@/components/Navigation';
import TaskCard from '@/components/TaskCard';
import ContractorCard from '@/components/ContractorCard';
import AchievementBadge from '@/components/AchievementBadge';

const Index = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [completedTasks, setCompletedTasks] = useState(0);
  const { toast } = useToast();

  const handleTaskComplete = () => {
    setCompletedTasks(prev => prev + 1);
    toast({
      title: "Great job! 🎉",
      description: "You're one step closer to mastering adulting!",
      duration: 3000,
    });
  };

  const upcomingTasks = [
    {
      title: "Change Furnace Filter",
      description: "Replace the HVAC filter to improve air quality",
      estimatedTime: "15 min",
      difficulty: "Easy" as const,
      dueDate: "In 3 days"
    },
    {
      title: "Clean Gutters",
      description: "Remove debris and check for proper drainage",
      estimatedTime: "2 hours",
      difficulty: "Medium" as const,
      dueDate: "Next week"
    },
    {
      title: "Test Smoke Detectors",
      description: "Check batteries and test alarm functionality",
      estimatedTime: "30 min",
      difficulty: "Easy" as const,
      dueDate: "This weekend"
    }
  ];

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

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <DashboardCard
                title="Upcoming Tasks"
                subtitle="3 items due soon"
                icon={Calendar}
                color="bg-gradient-to-br from-blue-soft to-blue-400"
                onClick={() => setActiveTab('reminders')}
                badge={3}
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
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Upcoming Tasks</h3>
              <div className="space-y-4">
                {upcomingTasks.map((task, index) => (
                  <TaskCard
                    key={index}
                    {...task}
                    onComplete={handleTaskComplete}
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
          </div>
        );

      case 'contractors':
        return (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Find Local Help</h3>
              <div className="space-y-4">
                {contractors.map((contractor, index) => (
                  <ContractorCard key={index} {...contractor} />
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-sage to-sage-light p-4 rounded-xl text-white">
              <h3 className="text-lg font-bold mb-2">Need a Custom Quote?</h3>
              <p className="text-sm mb-4 opacity-90">
                Post your project details and get multiple bids from verified contractors.
              </p>
              <button className="bg-white text-sage py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Post a Project
              </button>
            </div>
          </div>
        );

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
      </div>
    </div>
  );
};

export default Index;
