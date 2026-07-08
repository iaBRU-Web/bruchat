
CREATE TABLE public.youtube_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('short','video')),
  content_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_type, content_id)
);
ALTER TABLE public.youtube_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "yt_likes_select" ON public.youtube_likes FOR SELECT USING (true);
CREATE POLICY "yt_likes_insert" ON public.youtube_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "yt_likes_delete" ON public.youtube_likes FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX idx_yt_likes_content ON public.youtube_likes(content_type, content_id);

CREATE TABLE public.youtube_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('short','video')),
  content_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.youtube_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "yt_comments_select" ON public.youtube_comments FOR SELECT USING (true);
CREATE POLICY "yt_comments_insert" ON public.youtube_comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "yt_comments_delete" ON public.youtube_comments FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE INDEX idx_yt_comments_content ON public.youtube_comments(content_type, content_id, created_at DESC);
