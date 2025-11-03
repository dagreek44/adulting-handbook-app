
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AuthContextType, UserProfile, SignUpData } from '@/types/auth';
import { createUserProfile, fetchUserProfile } from '@/services/userProfileService';
import { signUpUser, signInUser, signOutUser } from '@/services/authService';
import { acceptPendingInvitations } from '@/services/familyInvitationService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const createMissingUserProfile = async (authUser: User) => {
    if (!authUser) {
      console.log('createMissingUserProfile: No user available');
      return;
    }

    console.log('createMissingUserProfile: Creating profile for user:', authUser.id);
    const profile = await createUserProfile(authUser, toast);
    if (profile) {
      setUserProfile(profile);
    }
  };

  const handleUserProfileFetch = async (userId: string, authUser: User, retryCount: number = 0) => {
    const profile = await fetchUserProfile(userId, retryCount);
    
    if (profile) {
      setUserProfile(profile);
    } else {
      setUserProfile(null);
      
      // Auto-create profile for authenticated users missing from users table
      if (retryCount === 0 && authUser) {
        console.log('handleUserProfileFetch: Attempting to auto-create missing profile');
        await createMissingUserProfile(authUser);
        // Don't retry to avoid infinite loops
      }
    }

    // Check for and accept pending family invitations
    if (authUser?.email) {
      setTimeout(async () => {
        const accepted = await acceptPendingInvitations(userId, authUser.email!);
        if (accepted) {
          // Re-fetch profile to get updated family_id
          const updatedProfile = await fetchUserProfile(userId, 0);
          if (updatedProfile) {
            setUserProfile(updatedProfile);
          }
        }
      }, 0);
    }
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, 'session:', !!session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer the profile fetch to avoid blocking auth state changes
          setTimeout(() => {
            handleUserProfileFetch(session.user.id, session.user);
          }, 0);
        } else {
          setUserProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session check:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        handleUserProfileFetch(session.user.id, session.user);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (userData: SignUpData) => {
    return await signUpUser(userData, toast);
  };

  const signIn = async (email: string, password: string) => {
    return await signInUser(email, password, toast);
  };

  const signOut = async () => {
    await signOutUser(toast);
    setUser(null);
    setSession(null);
    setUserProfile(null);
  };

  const createMissingUserProfileWrapper = async () => {
    if (user) {
      await createMissingUserProfile(user);
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    createMissingUserProfile: createMissingUserProfileWrapper,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
