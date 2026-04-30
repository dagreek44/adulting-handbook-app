
import React, { useState, useEffect } from 'react';
import { Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { Eye, EyeOff, User, Mail, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { getGlobalLaunchUrl } from '@/App';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';

const Auth = () => {
  const { user, signUp, signIn, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const emailFromUrl = searchParams.get('email');
  const signupFromUrl = searchParams.get('signup') === 'true';
  const resetFromUrl = searchParams.get('reset') === 'true';
  
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [launchUrlState, setLaunchUrlState] = useState<string | null>(null);
  
  console.log('=== AUTH PAGE RENDER ===');
  console.log('Auth - Location:', location.pathname + location.search);
  console.log('Auth - Reset from URL:', resetFromUrl, 'SearchParams:', Array.from(searchParams.entries()));
  console.log('Auth - Is Recovery Mode:', isRecoveryMode);
  console.log('Auth - GlobalLaunchUrl state:', launchUrlState);
  console.log('Auth - Should Show Reset:', resetFromUrl || isRecoveryMode);
  console.log('=== END AUTH PAGE RENDER ===');
  
  // Keep a local copy of the global launch URL so we can react to it if it arrives later
  useEffect(() => {
    const updateLaunchUrl = (event?: Event) => {
      const url = getGlobalLaunchUrl();
      console.log('Auth - globalLaunchUrlChanged event fired', event, 'resolved URL:', url);
      setLaunchUrlState(url);
    };

    updateLaunchUrl();
    window.addEventListener('globalLaunchUrlChanged', updateLaunchUrl);
    return () => window.removeEventListener('globalLaunchUrlChanged', updateLaunchUrl);
  }, []);

  // Check if we're in recovery mode by checking Supabase session or launch URL
  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        console.log('=== AUTH PAGE RECOVERY CHECK ===');
        
        // Check if we have a launch URL with recovery info
        const launchUrl = launchUrlState ?? getGlobalLaunchUrl();
        console.log('Auth - Global launch URL:', launchUrl);
        if (launchUrl) {
          console.log('Auth - Launch URL exists, checking content...');
          if (launchUrl.includes('reset=true') || launchUrl.includes('type=recovery')) {
            console.log('Auth - PASSWORD RESET DETECTED IN LAUNCH URL!');
            setIsRecoveryMode(true);
            return;
          }
        }
        
        // Check for recovery session from Supabase
        console.log('Auth - Checking Supabase session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.log('Auth - Session error:', error);
        }
        
        if (session) {
          console.log('Auth - SESSION FOUND:', session.user.email);
          console.log('Auth - Session user data:', {
            email: session.user.email,
            id: session.user.id,
            confirmed_at: session.user.confirmed_at,
            recovery_sent_at: session.user.recovery_sent_at,
            email_change_sent_at: session.user.email_change_sent_at,
            user_metadata: session.user.user_metadata
          });
          
          // If we have ANY session, assume it's recovery mode since user clicked the email
          console.log('Auth - Setting recovery mode to TRUE (active session detected)');
          setIsRecoveryMode(true);
        } else {
          console.log('Auth - NO SESSION FOUND');
        }
        
        console.log('=== AUTH PAGE RECOVERY CHECK COMPLETE ===');
      } catch (error) {
        console.error('Auth - Error checking recovery session:', error);
      }
    };
    
    // Check immediately
    checkRecoverySession();
    
    // Also listen for auth state changes
    console.log('Auth - Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth - AUTH STATE CHANGED:', event);
      if (event === 'PASSWORD_RECOVERY') {
        console.log('Auth - PASSWORD_RECOVERY EVENT!');
        setIsRecoveryMode(true);
      }
      if (session) {
        console.log('Auth - New session in onAuthStateChange:', session.user.email);
      }
    });
    
    return () => {
      console.log('Auth - Unsubscribing from auth listener');
      subscription?.unsubscribe();
    };
  }, [launchUrlState]);
  
  const [isLogin, setIsLogin] = useState(!signupFromUrl && !resetFromUrl);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: emailFromUrl || '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    username: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Determine if we should show the reset form
  const shouldShowReset = resetFromUrl || isRecoveryMode;
  
  // Update isLogin when recovery mode changes
  useEffect(() => {
    if (shouldShowReset) {
      setIsLogin(false);
    }
  }, [shouldShowReset]);

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <img src="/icon.png" alt="Adulting" className="w-24 h-24 mb-4" />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (shouldShowReset) {
        // Handle password reset
        console.log('=== PASSWORD RESET SUBMIT ===');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('Current session before update:', sessionData?.session ? 'Session exists' : 'No session');
        if (sessionData?.session) {
          console.log('Session user:', sessionData.session.user.email);
        } else {
          console.log('Session error:', sessionError);
        }
        
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters');
          return;
        }
        
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        
        const { error } = await supabase.auth.updateUser({
          password: formData.password
        });
        
        if (error) {
          setError(error.message);
        } else {
          toast.success('Password updated successfully!');
          // Redirect to login
          window.location.href = '/auth';
        }
      } else if (isLogin) {
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          setError(error.message);
        }
      } else {
        if (!formData.firstName || !formData.lastName || !formData.username) {
          setError('Please fill in all fields');
          return;
        }
        
        const { error } = await signUp({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
        });
        
        if (error) {
          setError(error.message);
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Debug Panel - Remove this after testing */}
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-3 py-2 rounded-lg text-xs mb-4 font-mono">
          <div>URL: {location.pathname + location.search}</div>
          <div>Reset param: {searchParams.get('reset')}</div>
          <div>Recovery mode: {isRecoveryMode ? 'YES' : 'NO'}</div>
          <div>Show reset form: {shouldShowReset ? 'YES' : 'NO'}</div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <img src="/icon.png" alt="Adulting" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {shouldShowReset ? 'Reset Your Password' : isLogin ? 'Welcome Back!' : 'Join the Adulting App'}
            </h1>
            <p className="text-gray-600">
              {shouldShowReset 
              ? 'Enter your new password below' 
              : isLogin 
                ? 'Sign in to continue your adulting journey' 
                : 'Start mastering life\'s essential skills'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {shouldShowReset ? (
            // Password reset form with confirmation
            <>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="New Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </>
          ) : (
            <>
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="pl-10"
                        required={!isLogin}
                      />
                    </div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="pl-10"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      name="username"
                      placeholder="Username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className="pl-10"
                      required={!isLogin}
                    />
                  </div>
                </>
              )}

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                  readOnly={!!emailFromUrl}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-sage hover:bg-sage/90 text-white py-3 rounded-lg font-medium transition-colors"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {shouldShowReset ? 'Updating Password...' : isLogin ? 'Signing In...' : 'Creating Account...'}
              </div>
            ) : (
              shouldShowReset ? 'Update Password' : isLogin ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>

        {!shouldShowReset && (
          <>
            {isLogin && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowForgotPassword(true)}
                  className="text-gray-500 hover:text-sage text-sm"
                >
                  Forgot your password?
                </button>
              </div>
            )}

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setShowForgotPassword(false);
                  setFormData({
                    email: '',
                    password: '',
                    confirmPassword: '',
                    firstName: '',
                    lastName: '',
                    username: '',
                  });
                }}
                className="text-sage hover:text-sage/80 font-medium"
              >
                {isLogin 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'
                }
              </button>
            </div>
          </>
        )}

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <ForgotPasswordModal 
            onClose={() => setShowForgotPassword(false)} 
          />
        )}
        </div>
      </div>
    </div>
  );
};

const getResetRedirectUrl = () => {
  const webRedirect = import.meta.env.VITE_WEB_AUTH_URL ?? `${window.location.origin}/auth?reset=true`;
  const mobileRedirect = import.meta.env.VITE_MOBILE_RESET_REDIRECT ?? 'adulting101://auth?reset=true';
  return Capacitor.getPlatform() === 'web' ? webRedirect : mobileRedirect;
};

const ForgotPasswordModal = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const redirectTo = getResetRedirectUrl();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setSent(true);
        toast.success('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Reset Password</h2>
        
        {sent ? (
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
            </p>
            <Button onClick={onClose} className="bg-sage hover:bg-sage/90">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-gray-600 text-sm mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <div className="relative mb-4">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !email}
                className="flex-1 bg-sage hover:bg-sage/90"
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
