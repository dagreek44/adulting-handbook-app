
import { useState } from "react";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import RemindersView from "@/components/RemindersView";
import CompletedTasksView from "@/components/CompletedTasksView";
import ReminderCalendarView from "@/components/ReminderCalendarView";
import ContractorsView from "@/components/ContractorsView";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import ProtectedRoute from "@/components/ProtectedRoute";

const Index = () => {
  const [activeView, setActiveView] = useState("reminders");
  const { reminders, completedTasks, loading } = useSupabaseData();

  const renderView = () => {
    switch (activeView) {
      case "reminders":
        return <RemindersView reminders={reminders} />;
      case "completed":
        return <CompletedTasksView completedTasks={completedTasks} />;
      case "calendar":
        return <ReminderCalendarView reminders={reminders} />;
      case "contractors":
        return <ContractorsView reminders={reminders} />;
      default:
        return <RemindersView reminders={reminders} />;
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
      <div className="min-h-screen bg-cream">
        <Header />
        <main className="container mx-auto px-4 py-6 pb-20">
          {renderView()}
        </main>
        <Navigation activeView={activeView} onViewChange={setActiveView} />
      </div>
    </ProtectedRoute>
  );
};

export default Index;
