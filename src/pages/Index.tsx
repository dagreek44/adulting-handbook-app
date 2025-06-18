
import { useState } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import RemindersView from "@/components/RemindersView";
import CompletedTasksView from "@/components/CompletedTasksView";
import ReminderCalendarView from "@/components/ReminderCalendarView";
import ContractorsView from "@/components/ContractorsView";
import TaskDetailModal from "@/components/TaskDetailModal";
import FamilyMembersModal from "@/components/FamilyMembersModal";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import ProtectedRoute from "@/components/ProtectedRoute";

const Index = () => {
  const [activeView, setActiveView] = useState("reminders");
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [reminderViewMode, setReminderViewMode] = useState<'list' | 'calendar'>('list');
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  
  const { 
    reminders, 
    completedTasks, 
    familyMembers, 
    loading,
    completeTask,
    addReminder,
    updateReminder,
    deleteReminder,
    fetchReminders,
    fetchCompletedTasks,
    fetchFamilyMembers
  } = useSupabaseData();

  const handleTaskComplete = async (task?: any) => {
    if (task) {
      await completeTask(task);
    }
    setIsModalOpen(false);
    setSelectedTask(null);
  };

  const handleNavigateToCompleted = () => {
    setActiveView("completed");
  };

  const supabaseOperations = {
    addReminder,
    updateReminder,
    deleteReminder
  };

  const renderView = () => {
    switch (activeView) {
      case "reminders":
        return (
          <RemindersView 
            reminders={reminders}
            setReminders={() => fetchReminders()}
            familyMembers={familyMembers}
            setFamilyMembers={() => fetchFamilyMembers()}
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
            onNavigateToCompleted={handleNavigateToCompleted}
            supabaseOperations={supabaseOperations}
          />
        );
      case "completed":
        return <CompletedTasksView completedTasks={completedTasks} />;
      case "calendar":
        return (
          <ReminderCalendarView 
            tasks={reminders.slice(0, 3).map(reminder => ({
              title: reminder.title,
              description: reminder.description,
              estimatedTime: reminder.estimated_time,
              difficulty: reminder.difficulty as 'Easy' | 'Medium' | 'Hard',
              dueDate: reminder.due_date || 'Not set',
            }))}
            reminders={reminders}
            onTaskClick={(task) => {
              setSelectedTask(task);
              setIsModalOpen(true);
            }}
            onTaskComplete={handleTaskComplete}
            familyMembers={familyMembers}
            supabaseOperations={supabaseOperations}
          />
        );
      case "contractors":
        return <ContractorsView reminders={reminders} />;
      default:
        return (
          <RemindersView 
            reminders={reminders}
            setReminders={() => fetchReminders()}
            familyMembers={familyMembers}
            setFamilyMembers={() => fetchFamilyMembers()}
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
            onNavigateToCompleted={handleNavigateToCompleted}
            supabaseOperations={supabaseOperations}
          />
        );
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-cream flex items-center justify-center">
          <div className="text-lg text-gray-600">Loading your data...</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-cream flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6 pb-20 max-w-md">
          {renderView()}
        </main>
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto">
          <Navigation activeTab={activeView} onTabChange={setActiveView} />
        </div>
        
        {/* Task Detail Modal */}
        {isModalOpen && selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onComplete={() => handleTaskComplete(selectedTask)}
          />
        )}

        {/* Family Members Modal */}
        {isFamilyModalOpen && (
          <FamilyMembersModal
            familyMembers={familyMembers}
            isOpen={isFamilyModalOpen}
            onClose={() => setIsFamilyModalOpen(false)}
            onUpdateMembers={() => fetchFamilyMembers()}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Index;
