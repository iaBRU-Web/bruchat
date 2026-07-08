
-- Create achievements table for certificates/milestones
CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  achievement_type text NOT NULL,
  achieved_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_type)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
ON public.achievements FOR SELECT
USING (true);

CREATE POLICY "Users earn own achievements"
ON public.achievements FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Add multi-step fields to verification_requests
ALTER TABLE public.verification_requests
ADD COLUMN IF NOT EXISTS full_name text DEFAULT '',
ADD COLUMN IF NOT EXISTS bio_text text DEFAULT '',
ADD COLUMN IF NOT EXISTS social_links text DEFAULT '',
ADD COLUMN IF NOT EXISTS category text DEFAULT '',
ADD COLUMN IF NOT EXISTS notable_work text DEFAULT '',
ADD COLUMN IF NOT EXISTS follower_count_at_apply integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS step_completed integer DEFAULT 0;
