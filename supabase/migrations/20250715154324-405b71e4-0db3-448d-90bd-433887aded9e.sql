-- Fix the handle_user_signup trigger to include password_hash
CREATE OR REPLACE FUNCTION public.handle_user_signup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Insert into users table when a new auth user is created
  INSERT INTO public.users (
    id, 
    email, 
    first_name, 
    last_name, 
    username,
    family_id,
    password_hash
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'username', ''),
    COALESCE((new.raw_user_meta_data ->> 'family_id')::uuid, gen_random_uuid()),
    'authenticated_via_supabase_auth'
  );
  RETURN new;
END;
$function$;