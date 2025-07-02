
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Wrench, Calendar, Trophy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import Header from '@/components/Header';
import DashboardCard from '@/components/DashboardCard';
import Navigation from '@/components/Navigation';
import TaskDetailModal from '@/components/TaskDetailModal';
import FamilyMembersModal from '@/components/FamilyMembersModal';
import RemindersView from "@/components/RemindersView";
import ContractorsView from "@/components/ContractorsView";
import CompletedTasksView from "@/components/CompletedTasksView";
import AchievementBadge from '@/components/AchievementBadge';

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [reminderViewMode, setReminderViewMode] = useState<'list' | 'calendar'>('list');
  const { toast } = useToast();

  // Call useSupabaseData unconditionally
  const {
    reminders,
    allReminders,
    completedTasks,
    familyMembers,
    loading,
    completeTask,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderEnabled
  } = useSupabaseData();

  // Handle loading states and redirects after all hooks
  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Get only the next 3 upcoming tasks
  const upcomingTasks = reminders.slice(0, 3);

  const handleTaskComplete = async (task?: any) => {
    if (task && task.id) {
      await completeTask(task);
    } else {
      toast({
        title: "Great job! 🎉",
        description: "You're one step closer to mastering adulting!",
        duration: 3000,
      });
    }
  };

  const convertTaskFormat = (task: any) => {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      estimatedTime: task.estimated_time,
      difficulty: task.difficulty as 'Easy' | 'Medium' | 'Hard',
      estimatedBudget: task.estimated_budget,
      dueDate: task.due_date || 'Not set',
      videoUrl: task.video_url,
      instructions: task.instructions || [],
      tools: task.tools || [],
      supplies: task.supplies || []
    };
  };

  const handleTaskClick = (task: any) => {
    const formattedTask = convertTaskFormat(task);
    setSelectedTask(formattedTask);
    setIsModalOpen(true);
  };

  const achievements = [
    {
      title: "First Timer",
      description: "Completed your first home maintenance task",
      level: 1,
      isUnlocked: completedTasks.length >= 1,
      category: "maintenance" as const,
      progress: Math.min(completedTasks.length * 100, 100)
    },
    {
      title: "DIY Rookie",
      description: "Completed 5 maintenance tasks on your own",
      level: 2,
      isUnlocked: completedTasks.length >= 5,
      category: "diy" as const,
      progress: Math.min((completedTasks.length / 5) * 100, 100)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="max-w-md mx-auto bg-white min-h-screen shadow-xl">
          <Header />
          <div className="p-4 pb-20 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your tasks...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                title="Recently Completed Tasks"
                subtitle={`${completedTasks.length} tasks completed`}
                icon={CheckCircle2}
                color="bg-gradient-to-br from-earth to-earth"
                onClick={() => setActiveTab('completed')}
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
            allReminders={allReminders}
            familyMembers={familyMembers}
            setFamilyMembers={() => {}}
            completedTasks={completedTasks.length}
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
            onNavigateToCompleted={() => setActiveTab('completed')}
            supabaseOperations={{
              addReminder,
              updateReminder,
              deleteReminder,
              toggleReminderEnabled
            }}
          />
        );

      case 'contractors':
        return <ContractorsView reminders={reminders} />;

      case 'completed':
        return <CompletedTasksView completedTasks={completedTasks} />;

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
                  style={{ width: `${(completedTasks.length / 10) * 100}%` }}
                />
              </div>
              <p className="text-xs mt-2 opacity-90">
                {completedTasks.length}/10 tasks to next level
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
          onComplete={() => handleTaskComplete(selectedTask)}
        />

        <FamilyMembersModal
          isOpen={isFamilyModalOpen}
          onClose={() => setIsFamilyModalOpen(false)}
          familyMembers={familyMembers}
          onUpdateMembers={() => {}}
        />
      </div>
    </div>
  );
};

export default Index;
