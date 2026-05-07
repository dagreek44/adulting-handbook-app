
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
  const [invitationsChecked, setInvitationsChecked] = useState(false);
  const { toast } = useToast();

  const createMissingUserProfile = async (authUser: User, familyIdOverride?: string) => {
    if (!authUser) {
      console.log('createMissingUserProfile: No user available');
      return;
    }

    console.log('createMissingUserProfile: Creating profile for user:', authUser.id);
    const profile = await createUserProfile(authUser, toast, familyIdOverride);
    if (profile) {
      setUserProfile(profile);
    }
  };

  const handleUserProfileFetch = async (userId: string, authUser: User, retryCount: number = 0) => {
    const profile = await fetchUserProfile(userId, retryCount, authUser);
    
    if (profile) {
      setUserProfile(profile);
    } else {
      setUserProfile(null);

      // Check for and accept pending family invitations before auto-creating a profile.
      let acceptedFamilyId: string | null = null;
      if (authUser?.email && !invitationsChecked) {
        setInvitationsChecked(true);
        acceptedFamilyId = await acceptPendingInvitations(userId, authUser.email!);
        if (acceptedFamilyId) {
          const updatedProfile = await fetchUserProfile(userId, 0, authUser);
          if (updatedProfile) {
            setUserProfile(updatedProfile);
          }
        }
      }

      // Auto-create profile for authenticated users missing from users table
      if (retryCount === 0 && authUser) {
        console.log('handleUserProfileFetch: Attempting to auto-create missing profile');
        await createMissingUserProfile(authUser, acceptedFamilyId || undefined);
      }
    }

    // If profile already exists, accept pending family invitations once per session
    if (profile && authUser?.email && !invitationsChecked) {
      setInvitationsChecked(true);
      acceptPendingInvitations(userId, authUser.email!).then((acceptedFamilyId) => {
        if (acceptedFamilyId) {
          fetchUserProfile(userId, 0, authUser).then(updatedProfile => {
            if (updatedProfile) {
              setUserProfile(updatedProfile);
            }
          });
        }
      }).catch(err => {
        console.error('Non-blocking invitation check failed:', err);
      });
    }
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state changed:', event, 'session:', !!session);

        // Don't trigger full reloads on token refreshes to avoid UI flickering/loops
        if (event === 'TOKEN_REFRESHED') return;

        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer the profile fetch to avoid blocking auth state changes
          setTimeout(() => {
            handleUserProfileFetch(session.user.id, session.user);
          }, 0);
        } else {
          setUserProfile(null);
          setInvitationsChecked(false);
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
    setInvitationsChecked(false); // Reset for new login
    return await signInUser(email, password, toast);
  };

  const signOut = async () => {
    await signOutUser(toast);
    setUser(null);
    setSession(null);
    setUserProfile(null);
    setInvitationsChecked(false);
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
