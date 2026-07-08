
-- Function to auto-follow the official BRU Chat account on new signup
CREATE OR REPLACE FUNCTION public.auto_follow_official_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _official_id uuid;
BEGIN
  -- Find the official account by username
  SELECT id INTO _official_id FROM public.profiles WHERE username = 'bruchat' LIMIT 1;
  
  -- Only follow if official account exists and it's not the official account itself
  IF _official_id IS NOT NULL AND _official_id != NEW.id THEN
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (NEW.id, _official_id)
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger on new profile creation
CREATE TRIGGER on_profile_created_follow_official
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_follow_official_account();

-- Make all existing users follow the official account (runs once, safe if account doesn't exist yet)
INSERT INTO public.follows (follower_id, following_id)
SELECT p.id, official.id
FROM public.profiles p
CROSS JOIN (SELECT id FROM public.profiles WHERE username = 'bruchat' LIMIT 1) official
WHERE p.id != official.id
ON CONFLICT DO NOTHING;
