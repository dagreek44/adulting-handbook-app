
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
  const changeFromUrl = searchParams.get('change') === 'true';
  
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [launchUrlState, setLaunchUrlState] = useState<string | null>(null);
  
  // Keep a local copy of the global launch URL so we can react to it if it arrives later
  useEffect(() => {
    const updateLaunchUrl = (event?: Event) => {
      const url = getGlobalLaunchUrl();
      setLaunchUrlState(url);
    };

    updateLaunchUrl();
    window.addEventListener('globalLaunchUrlChanged', updateLaunchUrl);
    return () => window.removeEventListener('globalLaunchUrlChanged', updateLaunchUrl);
  }, []);

  // Check if we're in recovery mode by checking URL parameters or auth events
  useEffect(() => {
    const checkRecoveryMode = () => {
      // Check if we have a launch URL with recovery info
      const launchUrl = launchUrlState ?? getGlobalLaunchUrl();
      if (launchUrl) {
        if (launchUrl.includes('reset=true') || launchUrl.includes('type=recovery')) {
          setIsRecoveryMode(true);
          return;
        }
      }
      
      // Check URL parameters
      if (resetFromUrl) {
        setIsRecoveryMode(true);
        return;
      }
    };
    
    // Check immediately
    checkRecoveryMode();
    
    // Also listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });
    
    return () => {
      subscription?.unsubscribe();
    };
  }, [launchUrlState, resetFromUrl]);

  
  const [isLogin, setIsLogin] = useState(!signupFromUrl && !resetFromUrl && !changeFromUrl);
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
  const shouldShowReset = resetFromUrl || changeFromUrl || isRecoveryMode;
  
  // Update isLogin when recovery mode changes
  useEffect(() => {
    if (shouldShowReset) {
      setIsLogin(false);
    }
  }, [shouldShowReset]);

  // Redirect if already authenticated, unless we're in recovery/reset mode
  if (user && !shouldShowReset) {
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

  // Show waiting UI for password reset until session is verified
  if (resetFromUrl && !isRecoveryMode) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <img src="/icon.png" alt="Adulting" className="w-24 h-24 mb-4" />
        <p className="text-sage text-lg">Verifying your reset link...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage mt-4"></div>
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
          toast.success(changeFromUrl ? 'Password changed successfully!' : 'Password updated successfully!');
          // Redirect based on context
          if (changeFromUrl) {
            window.location.href = '/dashboard';
          } else {
            window.location.href = '/auth';
          }
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
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <img src="/icon.png" alt="Adulting" className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {shouldShowReset ? (changeFromUrl ? 'Change Your Password' : 'Reset Your Password') : isLogin ? 'Welcome Back!' : 'Join the Adulting App'}
            </h1>
            <p className="text-gray-600">
              {shouldShowReset 
              ? (changeFromUrl ? 'Enter your new password below' : 'Enter your new password below')
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
