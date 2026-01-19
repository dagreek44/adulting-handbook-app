
import { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ReminderProvider } from "@/contexts/ReminderContext";
import { NotificationService } from "@/services/NotificationService";
import { DeviceTokenService } from "@/services/DeviceTokenService";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PostJob from "./pages/PostJob";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

// Component to setup notification listeners
const NotificationSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Request local notification permissions and setup listeners
    const setupNotifications = async () => {
      try {
        // Wait a tick to ensure Capacitor is fully initialized on native platforms
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await NotificationService.requestPermissions();
        
        // Setup listener for local notification clicks
        await NotificationService.setupNotificationListeners((taskId) => {
          navigate('/dashboard', { state: { openTaskId: taskId } });
        });
      } catch (error) {
        console.error('NotificationSetup: Failed to setup notifications:', error);
      }
    };
    
    setupNotifications();

    // Setup listener for push notification taps
    const handlePushNotificationTap = (event: CustomEvent<{ taskId: string }>) => {
      navigate('/dashboard', { state: { openTaskId: event.detail.taskId } });
    };

    window.addEventListener('push-notification-tap', handlePushNotificationTap as EventListener);

    return () => {
      window.removeEventListener('push-notification-tap', handlePushNotificationTap as EventListener);
    };
  }, [navigate]);

  // Initialize push notifications when user is authenticated
  useEffect(() => {
    if (user?.id) {
      // Add delay to ensure Capacitor is fully ready after login
      const timer = setTimeout(() => {
        DeviceTokenService.initialize(user.id).catch(err => {
          console.error('Failed to initialize DeviceTokenService:', err);
        });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [user?.id]);

  return null;
};

const App = () => (
  <ErrorBoundary>
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
  </ErrorBoundary>
);

export default App;
