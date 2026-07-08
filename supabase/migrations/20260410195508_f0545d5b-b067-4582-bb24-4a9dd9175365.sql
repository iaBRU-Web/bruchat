-- Create trigger to auto-follow bruchat when new users sign up
-- This ensures all new users automatically follow the official account

-- First drop the trigger if it exists to avoid errors
DROP TRIGGER IF EXISTS on_profile_created_follow_official ON public.profiles;

-- Create the trigger that runs after insert on profiles
CREATE TRIGGER on_profile_created_follow_official
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_follow_official_account();