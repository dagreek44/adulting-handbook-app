import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (userData: SignUpData) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  createMissingUserProfile: () => Promise<void>;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  family_id: string;
}

interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}

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

  const createMissingUserProfile = async () => {
    if (!user) {
      console.log('createMissingUserProfile: No user available');
      return;
    }

    try {
      console.log('createMissingUserProfile: Creating profile for user:', user.id);
      
      // Extract names from user metadata or use defaults
      const firstName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'User';
      const lastName = user.user_metadata?.last_name || '';
      const username = user.user_metadata?.username || user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;

      const { data, error } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email || '',
          first_name: firstName,
          last_name: lastName,
          username: username,
          password_hash: 'authenticated_via_supabase_auth', // Placeholder since user is already authenticated
          family_id: user.user_metadata?.family_id || undefined // Let it generate a new family_id
        })
        .select()
        .single();

      if (error) {
        console.error('createMissingUserProfile: Error creating user profile:', error);
        throw error;
      }

      console.log('createMissingUserProfile: Successfully created user profile:', data);
      setUserProfile(data);
      
      toast({
        title: "Profile Created",
        description: "Your user profile has been set up successfully!",
      });
    } catch (error) {
      console.error('createMissingUserProfile: Failed to create user profile:', error);
      toast({
        title: "Profile Creation Failed",
        description: "There was an issue creating your profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const fetchUserProfile = async (userId: string, retryCount: number = 0) => {
    try {
      console.log('fetchUserProfile: Fetching profile for user:', userId, 'retry:', retryCount);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle no rows gracefully

      if (error) {
        console.error('fetchUserProfile: Database error:', error);
        throw error;
      }

      if (data) {
        console.log('fetchUserProfile: Found user profile:', data);
        setUserProfile(data);
      } else {
        console.log('fetchUserProfile: No user profile found, user needs profile creation');
        setUserProfile(null);
        
        // Auto-create profile for authenticated users missing from users table
        if (retryCount === 0) {
          console.log('fetchUserProfile: Attempting to auto-create missing profile');
          await createMissingUserProfile();
          // Don't retry to avoid infinite loops
        }
      }
    } catch (error) {
      console.error('fetchUserProfile: Error fetching user profile:', error);
      setUserProfile(null);
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
            fetchUserProfile(session.user.id);
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
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (userData: SignUpData) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            username: userData.username
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Account Created!",
        description: "Welcome to the Adulting App!",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      setUserProfile(null);
      
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error) {
      console.error('Sign out error:', error);
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
    createMissingUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
