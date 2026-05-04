
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

const getCurrentPosition = async (): Promise<{ latitude: number; longitude: number } | null> => {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Geolocation permission denied or unavailable:', error);
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
      }
    );
  });
};

const reverseGeocodeCity = async (latitude: number, longitude: number): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();

    const address = data?.address;
    if (!address) return null;

    return (
      address.city ||
      address.town ||
      address.village ||
      address.hamlet ||
      address.county ||
      null
    );
  } catch (error) {
    console.error('reverseGeocodeCity: Failed to resolve city from coordinates:', error);
    return null;
  }
};

const getCityFromLocation = async (): Promise<string | null> => {
  try {
    const coords = await getCurrentPosition();
    if (!coords) return null;
    return await reverseGeocodeCity(coords.latitude, coords.longitude);
  } catch (error) {
    console.error('getCityFromLocation: Error obtaining city:', error);
    return null;
  }
};

export const createUserProfile = async (
  user: any,
  toast: ReturnType<typeof useToast>['toast'],
  familyIdOverride?: string
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
    const familyId = familyIdOverride || user.user_metadata?.family_id || crypto.randomUUID();

    let city = user.user_metadata?.city || null;
    if (!city) {
      city = await getCityFromLocation();
    }

    if (city) {
      const { error: cityMetadataError } = await supabase.auth.updateUser({
        data: {
          city,
        },
      });

      if (cityMetadataError) {
        console.error('createUserProfile: Failed to persist city in auth metadata:', cityMetadataError);
      }
    }

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
    } else if (familyIdOverride && existingProfile.family_id !== familyIdOverride) {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ family_id: familyIdOverride })
        .eq('id', user.id);

      if (profileUpdateError) {
        console.error('createUserProfile: Error updating profile family_id:', profileUpdateError);
      }
    }

    // Now handle the 'users' table (required by some existing services)
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (existingUser) {
      if (familyIdOverride && existingUser.family_id !== familyIdOverride) {
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({ family_id: familyIdOverride })
          .eq('id', user.id);

        if (userUpdateError) {
          console.error('createUserProfile: Error updating user family_id:', userUpdateError);
        }
      }

      console.log('createUserProfile: User entry already exists');
      return {
        ...existingUser,
        first_login: existingProfile?.first_login ?? true,
        city: city || undefined,
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
      first_login: true,
      city: city || undefined,
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
  retryCount: number = 0,
  authUser?: any
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
      const city =
        (profileData as any)?.city ||
        (userData as any)?.city ||
        authUser?.user_metadata?.city ||
        undefined;

      return {
        id: userId,
        email: userData?.email || profileData?.["Email Address"] || '',
        first_name: profileData?.first_name || userData?.first_name || '',
        last_name: profileData?.last_name || userData?.last_name || '',
        username: profileData?.username || userData?.username || '',
        family_id: profileData?.family_id || userData?.family_id || '',
        first_login: profileData?.first_login ?? false,
        city,
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
