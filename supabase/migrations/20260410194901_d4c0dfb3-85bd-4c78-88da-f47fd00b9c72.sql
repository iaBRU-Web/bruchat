
-- Auto-like posts from the bruchat account
CREATE OR REPLACE FUNCTION public.auto_like_from_official()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _official_id uuid;
BEGIN
  SELECT id INTO _official_id FROM public.profiles WHERE username = 'bruchat' LIMIT 1;
  IF _official_id IS NOT NULL AND _official_id != NEW.user_id THEN
    INSERT INTO public.post_likes (post_id, user_id)
    VALUES (NEW.id, _official_id)
    ON CONFLICT DO NOTHING;
    -- Increment likes_count
    UPDATE public.posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_created_auto_like
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.auto_like_from_official();

-- Auto-comment on posts from the bruchat account
CREATE OR REPLACE FUNCTION public.auto_comment_from_official()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _official_id uuid;
  _comments text[] := ARRAY[
    '🔥 Nice post!',
    'Love this! 💯',
    'Great content! Keep it up 🙌',
    'This is awesome! 🚀',
    'Amazing! 👏',
    'Super cool! ✨',
    'Love seeing this! 💜',
    'Brilliant! 🌟'
  ];
  _picked text;
BEGIN
  SELECT id INTO _official_id FROM public.profiles WHERE username = 'bruchat' LIMIT 1;
  IF _official_id IS NOT NULL AND _official_id != NEW.user_id THEN
    _picked := _comments[1 + floor(random() * array_length(_comments, 1))::int];
    INSERT INTO public.post_comments (post_id, user_id, content)
    VALUES (NEW.id, _official_id, _picked);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_post_created_auto_comment
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.auto_comment_from_official();
