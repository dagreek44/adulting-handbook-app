-- Step 1: Fix Sarah's email in users table
UPDATE users 
SET email = 'sarahluckett0@gmail.com'
WHERE id = 'c0f3804f-defb-4fef-8346-59953730384f' 
  AND email = 'no-email@example.com';

-- Step 2: Create function to sync user email from auth.users to users table
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update users table email if it doesn't match auth
  UPDATE users
  SET email = NEW.email
  WHERE id = NEW.id AND email != NEW.email;
  
  RETURN NEW;
END;
$$;

-- Step 3: Create trigger to automatically sync emails
DROP TRIGGER IF EXISTS sync_user_email_trigger ON auth.users;
CREATE TRIGGER sync_user_email_trigger
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_email();