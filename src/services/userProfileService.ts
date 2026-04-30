
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
    
    // Check if profile already exists in the profiles table (our primary source of truth)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const firstName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'User';
    const lastName = user.user_metadata?.last_name || '';
    const username = user.user_metadata?.username || user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
    const familyId = user.user_metadata?.family_id || crypto.randomUUID();

    if (!existingProfile) {
      console.log('createUserProfile: Creating entry in profiles table');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          username: username,
          family_id: familyId,
          "Email Address": user.email || '',
          first_login: true
        });

      if (profileError) {
        console.error('createUserProfile: Error creating profile entry:', profileError);
        // We continue anyway to try and create the 'users' entry
      }
    }

    // Now handle the 'users' table (required by some existing services)
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (existingUser) {
      console.log('createUserProfile: User entry already exists');
      return {
        ...existingUser,
        first_login: existingProfile?.first_login ?? true
      };
    }

    const { data, error: userTableError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
        first_name: firstName,
        last_name: lastName,
        username: username,
        family_id: familyId,
        password_hash: 'managed_by_supabase_auth' // Required field in schema
      })
      .select()
      .single();

    if (userTableError) {
      console.error('createUserProfile: Error creating user table entry:', userTableError);
      throw userTableError;
    }

    toast({
      title: "Profile Created",
      description: "Your user profile has been set up successfully!",
    });
    
    return {
      ...data,
      first_login: true
    };
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
    console.log('fetchUserProfile: Fetching profile for user:', userId);
    
    // Fetch from profiles table first (primary source for family_id and metadata)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;

    // Fetch from users table to get remaining fields
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profileData || userData) {
      return {
        id: userId,
        email: userData?.email || profileData?.["Email Address"] || '',
        first_name: profileData?.first_name || userData?.first_name || '',
        last_name: profileData?.last_name || userData?.last_name || '',
        username: profileData?.username || userData?.username || '',
        family_id: profileData?.family_id || userData?.family_id || '',
        first_login: profileData?.first_login ?? false
      };
    }

    return null;
  } catch (error) {
    console.error('fetchUserProfile: Error fetching user profile:', error);
    return null;
  }
};

export const completeOnboarding = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ first_login: false })
      .eq('id', userId);
    
    if (error) {
      console.error('completeOnboarding: Error:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('completeOnboarding: Failed:', error);
    return false;
  }
};
