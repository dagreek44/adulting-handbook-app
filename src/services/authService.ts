
import { supabase } from '@/integrations/supabase/client';
import { SignUpData } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

export const signUpUser = async (
  userData: SignUpData,
  toast: ReturnType<typeof useToast>['toast']
) => {
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

export const signInUser = async (
  email: string,
  password: string,
  toast: ReturnType<typeof useToast>['toast']
) => {
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

export const signOutUser = async (toast: ReturnType<typeof useToast>['toast']) => {
  try {
    await supabase.auth.signOut();
    
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  } catch (error) {
    console.error('Sign out error:', error);
  }
};
