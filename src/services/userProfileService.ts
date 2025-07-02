
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

export const createUserProfile = async (
  user: any,
  toast: ReturnType<typeof useToast>['toast']
): Promise<UserProfile | null> => {
  if (!user) {
    console.log('createUserProfile: No user available');
    return null;
  }

  try {
    console.log('createUserProfile: Creating profile for user:', user.id);
    
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
        password_hash: 'authenticated_via_supabase_auth',
        family_id: user.user_metadata?.family_id || undefined
      })
      .select()
      .single();

    if (error) {
      console.error('createUserProfile: Error creating user profile:', error);
      throw error;
    }

    console.log('createUserProfile: Successfully created user profile:', data);
    
    toast({
      title: "Profile Created",
      description: "Your user profile has been set up successfully!",
    });
    
    return data;
  } catch (error) {
    console.error('createUserProfile: Failed to create user profile:', error);
    toast({
      title: "Profile Creation Failed",
      description: "There was an issue creating your profile. Please try again.",
      variant: "destructive"
    });
    return null;
  }
};

export const fetchUserProfile = async (
  userId: string,
  retryCount: number = 0
): Promise<UserProfile | null> => {
  try {
    console.log('fetchUserProfile: Fetching profile for user:', userId, 'retry:', retryCount);
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('fetchUserProfile: Database error:', error);
      throw error;
    }

    if (data) {
      console.log('fetchUserProfile: Found user profile:', data);
      return data;
    } else {
      console.log('fetchUserProfile: No user profile found, user needs profile creation');
      return null;
    }
  } catch (error) {
    console.error('fetchUserProfile: Error fetching user profile:', error);
    return null;
  }
};
