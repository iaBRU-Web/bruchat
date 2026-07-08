
-- Auto-like bruchat's posts from all users
CREATE OR REPLACE FUNCTION public.auto_like_official_posts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _official_id uuid;
  _like_count int;
BEGIN
  SELECT id INTO _official_id FROM public.profiles WHERE username = 'bruchat' LIMIT 1;
  
  IF _official_id IS NULL OR NEW.user_id != _official_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.post_likes (post_id, user_id)
  SELECT NEW.id, p.id
  FROM public.profiles p
  WHERE p.id != _official_id
  ON CONFLICT DO NOTHING;

  SELECT count(*) INTO _like_count FROM public.post_likes WHERE post_id = NEW.id;
  UPDATE public.posts SET likes_count = _like_count WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Auto-comment on bruchat's posts from all users
CREATE OR REPLACE FUNCTION public.auto_comment_official_posts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _official_id uuid;
  _comment_count int;
  _comments text[] := ARRAY[
    '🔥 Amazing!',
    'Love this! 💯',
    'Great post! 🙌',
    'Awesome! 🚀',
    'So cool! ✨',
    'Nice one! 👏',
    'This is fire! 🔥',
    'Love it! 💜',
    'Incredible! 🌟',
    'Keep it up! 💪'
  ];
  _user record;
BEGIN
  SELECT id INTO _official_id FROM public.profiles WHERE username = 'bruchat' LIMIT 1;
  
  IF _official_id IS NULL OR NEW.user_id != _official_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.post_comments (post_id, user_id, content)
  SELECT NEW.id, p.id, _comments[1 + floor(random() * array_length(_comments, 1))::int]
  FROM public.profiles p
  WHERE p.id != _official_id;

  SELECT count(*) INTO _comment_count FROM public.post_comments WHERE post_id = NEW.id;
  UPDATE public.posts SET comments_count = _comment_count WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS on_official_post_auto_like ON public.posts;
CREATE TRIGGER on_official_post_auto_like
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.auto_like_official_posts();

DROP TRIGGER IF EXISTS on_official_post_auto_comment ON public.posts;
CREATE TRIGGER on_official_post_auto_comment
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION public.auto_comment_official_posts();
