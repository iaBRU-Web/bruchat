
CREATE OR REPLACE FUNCTION public.prevent_privileged_profile_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow service_role / superuser to change anything
  IF current_setting('role', true) = 'service_role' OR session_user = 'postgres' THEN
    RETURN NEW;
  END IF;

  IF NEW.is_banned IS DISTINCT FROM OLD.is_banned THEN
    RAISE EXCEPTION 'Not allowed to modify is_banned';
  END IF;
  IF NEW.post_limit_override IS DISTINCT FROM OLD.post_limit_override THEN
    RAISE EXCEPTION 'Not allowed to modify post_limit_override';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_privileged_updates ON public.profiles;
CREATE TRIGGER profiles_prevent_privileged_updates
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_privileged_profile_updates();
