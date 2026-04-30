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
import { App as CapacitorApp } from '@capacitor/app';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Store the launch URL globally so Auth page can access it
let globalLaunchUrl: string | null = null;

export const getGlobalLaunchUrl = () => globalLaunchUrl;
export const setGlobalLaunchUrl = (url: string | null) => { globalLaunchUrl = url; };

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

  // Setup deep link listeners
  useEffect(() => {
    if (!capacitorReady) return;

    const setupDeepLinks = async () => {
      try {
        console.log('=== DEEP LINK SETUP STARTING ===');
        
        const normalizeDeepLink = (url: string) => {
          if (!url.startsWith('adulting101://')) return url;

          const remainder = url.substring('adulting101://'.length);
          if (remainder.startsWith('/')) {
            return `https://adulting101${remainder}`;
          }

          if (remainder.startsWith('?')) {
            return `https://adulting101/${remainder}`;
          }

          return `https://adulting101/${remainder}`;
        };

        const handleDeepLink = (url: string) => {
          console.log('>>> handleDeepLink called with:', url);

          try {
            const parsedUrl = new URL(url);
            const host = parsedUrl.host;
            const pathname = parsedUrl.pathname || '/';
            const resetParam = parsedUrl.searchParams.get('reset');
            const typeParam = parsedUrl.searchParams.get('type');

            console.log('>>> Parsed URL - host:', host);
            console.log('>>> Parsed URL - pathname:', pathname);
            console.log('>>> Parsed URL - reset param:', resetParam);
            console.log('>>> Parsed URL - type param:', typeParam);
            console.log('>>> Full searchParams:', Array.from(parsedUrl.searchParams.entries()));

            const isPasswordReset = (host === 'auth' && resetParam === 'true') || typeParam === 'recovery';

            if (isPasswordReset) {
              console.log('>>> PASSWORD RESET DETECTED - navigating to /?reset=true');
              setGlobalLaunchUrl(url);
              window.dispatchEvent(new CustomEvent('globalLaunchUrlChanged', { detail: url }));
              setTimeout(() => {
                navigate('/?reset=true', { replace: true });
              }, 100);
            } else if (host === 'dashboard' || pathname === '/dashboard') {
              console.log('>>> DASHBOARD DETECTED - navigating');
              setTimeout(() => {
                navigate('/dashboard', { replace: true });
              }, 100);
            } else {
              console.log('>>> No match for pathname or params, storing URL and navigating to /?reset=true anyway');
              setGlobalLaunchUrl(url);
              window.dispatchEvent(new CustomEvent('globalLaunchUrlChanged', { detail: url }));
              setTimeout(() => {
                navigate('/?reset=true', { replace: true });
              }, 100);
            }
          } catch (parseError) {
            console.error('>>> Error parsing deep link:', parseError);
            if (url.includes('reset=true') || url.includes('type=recovery')) {
              setGlobalLaunchUrl(url);
              setTimeout(() => {
                navigate('/?reset=true', { replace: true });
              }, 100);
            }
          }
        };
        
        // Listen for app URL open events (deep links)
        const listener = await CapacitorApp.addListener('appUrlOpen', (data) => {
          console.log('App opened with URL:', data.url);
          handleDeepLink(data.url);
        });

        // Also check for initial URL when app starts
        console.log('>>> Calling App.getLaunchUrl()...');
        try {
          const { url } = await CapacitorApp.getLaunchUrl();
          console.log('>>> App.getLaunchUrl() returned:', url);
          if (url) {
            console.log('>>> Launch URL found, processing it...');
            setGlobalLaunchUrl(url);
            handleDeepLink(url);
          } else {
            console.log('>>> No launch URL');
          }
        } catch (error) {
          console.log('>>> Error getting launch URL:', error);
        }

        console.log('=== DEEP LINK SETUP COMPLETE ===');
        
        return () => {
          listener.remove();
        };
      } catch (error) {
        console.error('Deep link setup failed:', error);
      }
    };

    const cleanup = setupDeepLinks();
    return () => {
      cleanup.then(c => c?.());
    };
  }, [capacitorReady, navigate]);

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
