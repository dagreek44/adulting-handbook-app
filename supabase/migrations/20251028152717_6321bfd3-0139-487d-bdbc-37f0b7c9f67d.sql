-- Fix existing invited user who was created with wrong family_id
-- This corrects the user matthew_luckett@hotmail.com

DO $$
DECLARE
  broken_user_id UUID := 'e1f11d05-ac8c-47d3-bb3a-f4b7f7a9f475';
  correct_family_id UUID := '033274e6-4b5e-4bfe-bb19-717c87ef0659';
  broken_family_id UUID := 'b4aa2556-16d6-4728-8a60-691be46458d6';
BEGIN
  -- Update the user's family_id to the correct one
  UPDATE public.users
  SET family_id = correct_family_id
  WHERE id = broken_user_id;
  
  -- Create the missing profile with correct family_id
  INSERT INTO public.profiles (id, first_name, last_name, username, family_id)
  SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.username,
    correct_family_id
  FROM public.users u
  WHERE u.id = broken_user_id
  ON CONFLICT (id) DO UPDATE
  SET family_id = correct_family_id;
  
  -- Update the family_members entry with the profile_id
  UPDATE public.family_members
  SET profile_id = broken_user_id
  WHERE email = 'matthew_luckett@hotmail.com' 
    AND family_id = correct_family_id
    AND profile_id IS NULL;
  
  -- Mark the invitation as accepted
  UPDATE public.family_invitations
  SET status = 'accepted'
  WHERE invitee_email = 'matthew_luckett@hotmail.com'
    AND family_id = correct_family_id
    AND status = 'pending';
    
  -- Clean up the incorrectly created family_members entry in the wrong family
  DELETE FROM public.family_members
  WHERE family_id = broken_family_id
    AND email = 'matthew_luckett@hotmail.com';
    
END $$;