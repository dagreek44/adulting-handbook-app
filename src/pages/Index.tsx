import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Wrench, Calendar, Trophy, CheckCircle2, CalendarPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useReminders, type UserTask } from '@/contexts/ReminderContext';
import { useBadges } from '@/hooks/useBadges';
import Header from '@/components/Header';
import DashboardCard from '@/components/DashboardCard';
import Navigation from '@/components/Navigation';
import TaskDetailModal from '@/components/TaskDetailModal';
import FamilyMembersModal from '@/components/FamilyMembersModal';
import RemindersView from "@/components/RemindersView";
import ContractorsView from "@/components/ContractorsView";
import CompletedTasksView from "@/components/CompletedTasksView";
import AchievementBadge from '@/components/AchievementBadge';
import SharedHeader from '@/components/SharedHeader';
import OnboardingTour from '@/components/OnboardingTour';
import { CalendarSyncService } from '@/services/CalendarSyncService';
import { completeOnboarding } from '@/services/userProfileService';

const Index = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { toast } = useToast();

  // Use the new reminder context
  const { userTasks, completedTasks, loading: tasksLoading, markTaskCompleted } = useReminders();

  // Use badges hook
  const { badges, loading: badgesLoading, updateBadgesAfterTaskComplete } = useBadges();

  // Call useSupabaseData for family members 
  const {
    familyMembers,
    loading: supabaseLoading,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleReminderEnabled,
    fetchFamilyMembers
  } = useSupabaseData();

  // Check if user should see onboarding
  useEffect(() => {
    if (userProfile?.first_login === true) {
      setShowOnboarding(true);
    }
  }, [userProfile]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    if (user?.id) {
      await completeOnboarding(user.id);
    }
  };

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

  // Filter to show only pending tasks
  const pendingTasks = userTasks.filter(task => task.status !== 'completed');
  const upcomingTasks = pendingTasks.slice(0, 3);

  const handleTaskComplete = async (task?: any) => {
    if (task && task.id) {
      try {
        await markTaskCompleted(task.id);
        // Update badges after task completion
        await updateBadgesAfterTaskComplete();
        toast({
          title: "Great job! 🎉",
          description: "Task completed successfully!",
          duration: 3000,
        });
      } catch (error) {
        console.error('Failed to complete task:', error);
        toast({
          title: "Error",
          description: "Failed to complete task",
          variant: "destructive"
        });
      }
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
      supplies: task.supplies || [],
      isGlobalReminder: task.reminder_id != null // Mark as global reminder if it has a reminder_id
    };
  };

  const handleTaskClick = (task: any) => {
    const formattedTask = convertTaskFormat(task);
    setSelectedTask(formattedTask);
    setIsModalOpen(true);
  };

  const loading = tasksLoading || supabaseLoading || badgesLoading;

  // Get recent achievements (unlocked badges first, then by progress)
  const recentAchievements = [...badges]
    .sort((a, b) => {
      if (a.isUnlocked && !b.isUnlocked) return -1;
      if (!a.isUnlocked && b.isUnlocked) return 1;
      return (b.progress / b.maxProgress) - (a.progress / a.maxProgress);
    })
    .slice(0, 2);

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
              <div data-tour="upcoming-tasks">
                <DashboardCard
                  title="Upcoming Tasks"
                  subtitle={`${upcomingTasks.length} items due soon`}
                  icon={Calendar}
                  color="bg-gradient-to-br from-blue-soft to-blue-400"
                  onClick={() => setActiveTab('reminders')}
                  badge={upcomingTasks.length}
                />
              </div>
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
                {recentAchievements.map((badge) => (
                  <AchievementBadge key={badge.key} {...badge} />
                ))}
              </div>
            </div>
          </div>
        );

      case 'reminders':
        return (
          <RemindersView
            allReminders={[]}
            familyMembers={familyMembers}
            setFamilyMembers={() => {}}
            completedTasks={completedTasks.length}
            onTaskComplete={handleTaskComplete}
            selectedTask={selectedTask}
            setSelectedTask={setSelectedTask}
            setIsModalOpen={setIsModalOpen}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
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
        // Convert userTasks to a format that matches SupabaseReminder for ContractorsView
        const convertedTasksForContractors = pendingTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          difficulty: task.difficulty,
          estimated_time: task.estimated_time,
          estimated_budget: task.estimated_budget,
          frequency: 'monthly', // Default frequency
          due_date: task.due_date,
          enabled: true,
          video_url: task.video_url,
          instructions: task.instructions,
          tools: task.tools,
          supplies: task.supplies,
          is_custom: task.is_custom,
          created_at: task.created_at,
          updated_at: task.created_at,
          family_id: null,
          assignees: task.assignees
        }));
        return (
          <div className="space-y-6">
            <SharedHeader
              title="Contractors"
              setIsFamilyModalOpen={setIsFamilyModalOpen}
            />
            <ContractorsView reminders={convertedTasksForContractors} />
          </div>
        );

      case 'completed':
        return (
          <div className="space-y-6">
            <SharedHeader
              title="Completed Tasks"
              setIsFamilyModalOpen={setIsFamilyModalOpen}
            />
            <CompletedTasksView />
          </div>
        );

      case 'achievements':
        const starterBadges = badges.filter(b => b.category === 'starter');
        const completionBadges = badges.filter(b => b.category === 'completion');
        const streakBadges = badges.filter(b => b.category === 'streak');
        const unlockedCount = badges.filter(b => b.isUnlocked).length;
        
        return (
          <div className="space-y-6">
            <SharedHeader
              title="Achievements"
              setIsFamilyModalOpen={setIsFamilyModalOpen}
            />
            
            {/* Progress Overview */}
            <div className="bg-gradient-to-br from-blue-soft to-blue-soft/80 p-4 rounded-xl text-primary-foreground">
              <h3 className="text-lg font-bold mb-2">Level Up! 🚀</h3>
              <p className="text-sm mb-4 opacity-90">
                Complete tasks to unlock badges and become a household hero!
              </p>
              <div className="bg-white/20 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-300"
                  style={{ width: `${(unlockedCount / badges.length) * 100}%` }}
                />
              </div>
              <p className="text-xs mt-2 opacity-90">
                {unlockedCount}/{badges.length} badges unlocked
              </p>
            </div>

            {/* Starter Badges */}
            <div className="bg-card p-4 rounded-xl shadow-md">
              <h3 className="text-lg font-bold text-card-foreground mb-4">🚀 Starter Badges</h3>
              <div className="grid grid-cols-1 gap-3">
                {starterBadges.map((badge) => (
                  <AchievementBadge key={badge.key} {...badge} />
                ))}
              </div>
            </div>

            {/* Task Completion Badges */}
            <div className="bg-card p-4 rounded-xl shadow-md">
              <h3 className="text-lg font-bold text-card-foreground mb-4">✅ Task Completion Badges</h3>
              <div className="grid grid-cols-1 gap-3">
                {completionBadges.map((badge) => (
                  <AchievementBadge key={badge.key} {...badge} />
                ))}
              </div>
            </div>

            {/* Streak Badges */}
            <div className="bg-card p-4 rounded-xl shadow-md">
              <h3 className="text-lg font-bold text-card-foreground mb-4">🔥 Streak Badges</h3>
              <div className="grid grid-cols-1 gap-3">
                {streakBadges.map((badge) => (
                  <AchievementBadge key={badge.key} {...badge} />
                ))}
              </div>
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
          onClose={() => {
            setIsFamilyModalOpen(false);
            fetchFamilyMembers();
          }}
          familyMembers={familyMembers}
          onUpdateMembers={(updatedMembers) => {
            console.log('Family members updated:', updatedMembers);
          }}
        />

        <OnboardingTour
          isActive={showOnboarding}
          onComplete={handleOnboardingComplete}
          currentTab={activeTab}
          onNavigate={setActiveTab}
          onOpenFamily={() => setIsFamilyModalOpen(true)}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
        />
      </div>
    </div>
  );
};

export default Index;
