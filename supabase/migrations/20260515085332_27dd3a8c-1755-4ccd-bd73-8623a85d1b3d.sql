
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS reposted_from_id uuid;
CREATE INDEX IF NOT EXISTS idx_posts_reposted_from ON public.posts(reposted_from_id);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS post_limit_override integer;

ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS promo_free_verification boolean NOT NULL DEFAULT false;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS promo_end_date timestamptz;

CREATE TABLE IF NOT EXISTS public.youtube_shorts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  url text NOT NULL,
  title text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.youtube_shorts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view shorts" ON public.youtube_shorts FOR SELECT USING (true);
CREATE POLICY "Users add own shorts" ON public.youtube_shorts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own shorts" ON public.youtube_shorts FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.youtube_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  url text NOT NULL,
  title text NOT NULL DEFAULT '',
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view videos" ON public.youtube_videos FOR SELECT USING (true);
CREATE POLICY "Users add own videos" ON public.youtube_videos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own videos" ON public.youtube_videos FOR DELETE TO authenticated USING (user_id = auth.uid());
