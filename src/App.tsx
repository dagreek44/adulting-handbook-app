
import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReminderProvider } from "@/contexts/ReminderContext";
import { NotificationService } from "@/services/NotificationService";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PostJob from "./pages/PostJob";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to setup notification listeners
const NotificationSetup = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Request notification permissions and setup listeners
    NotificationService.requestPermissions();
    
    // Setup listener for notification clicks
    NotificationService.setupNotificationListeners((taskId) => {
      // Navigate to dashboard when notification is clicked
      navigate('/dashboard', { state: { openTaskId: taskId } });
    });
  }, [navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ReminderProvider>
            <NotificationSetup />
            <Routes>
              <Route path="/" element={<Auth />} />
              <Route path="/dashboard" element={<Index />} />
              <Route path="/post-job" element={<PostJob />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ReminderProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
