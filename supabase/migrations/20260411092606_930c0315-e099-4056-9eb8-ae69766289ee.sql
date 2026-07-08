
-- Add badge_type column
ALTER TABLE public.verified_users ADD COLUMN badge_type text NOT NULL DEFAULT 'true';

-- Seed new verified users
INSERT INTO public.verified_users (user_id, badge_type)
SELECT id, 'true' FROM public.profiles WHERE lower(username) IN ('filsnestor', 'valentingumanayo', 'kararansoro', 'empirekingsun', 'hirwaemeryblessing')
ON CONFLICT (user_id) DO NOTHING;

-- Allow service role to manage verified_users (for admin operations)
CREATE POLICY "Service role manages verified_users" ON public.verified_users FOR ALL TO public USING (true) WITH CHECK (true);
