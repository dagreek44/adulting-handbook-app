import { useEffect, useState } from 'react';
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
import { waitForCapacitor } from "@/utils/capacitorUtils";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PostJob from "./pages/PostJob";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to setup notification listeners
const NotificationSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [capacitorReady, setCapacitorReady] = useState(false);

  // Wait for Capacitor to be ready before initializing any native features
  useEffect(() => {
    const initCapacitor = async () => {
      console.log('NotificationSetup: Waiting for Capacitor...');
      const isReady = await waitForCapacitor(3000);
      console.log('NotificationSetup: Capacitor ready:', isReady);
      setCapacitorReady(true);
    };
    
    initCapacitor();
  }, []);

  // Setup local notification listeners once Capacitor is ready
  useEffect(() => {
    if (!capacitorReady) return;

    const setupNotifications = async () => {
      try {
        console.log('NotificationSetup: Setting up notifications...');
        await NotificationService.requestPermissions();
        
        await NotificationService.setupNotificationListeners((taskId) => {
          navigate('/dashboard', { state: { openTaskId: taskId } });
        });
        console.log('NotificationSetup: Notifications setup complete');
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
  }, [navigate, capacitorReady]);

  // Initialize push notifications when user is authenticated AND Capacitor is ready
  useEffect(() => {
    if (!user?.id || !capacitorReady) return;

    console.log('NotificationSetup: Initializing DeviceTokenService for user:', user.id);
    
    // Add extra delay for safety
    const timer = setTimeout(() => {
      DeviceTokenService.initialize(user.id).catch(err => {
        console.error('NotificationSetup: Failed to initialize DeviceTokenService:', err);
      });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [user?.id, capacitorReady]);

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
