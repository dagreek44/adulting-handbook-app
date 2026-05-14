
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
        data: { city },
      });
      if (cityMetadataError) {
        console.error('createUserProfile: Failed to persist city in auth metadata:', cityMetadataError);
      }
    }

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
        first_login: (existingUser as any).first_login ?? true,
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
      first_login: (data as any)?.first_login ?? true,
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

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (userError) throw userError;
    if (!userData) return null;

    const city =
      (userData as any)?.city ||
      authUser?.user_metadata?.city ||
      undefined;

    return {
      id: userId,
      email: userData.email || '',
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      username: userData.username || '',
      family_id: userData.family_id || '',
      first_login: (userData as any).first_login ?? false,
      city,
    };
  } catch (error) {
    console.error('fetchUserProfile: Error fetching user profile:', error);
    return null;
  }
};

export const completeOnboarding = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ first_login: false } as any)
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
