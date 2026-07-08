
-- 1. Private credentials table
CREATE TABLE IF NOT EXISTS public.user_credentials (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  password_plain text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
-- No policies => only service_role (which bypasses RLS) can access.

INSERT INTO public.user_credentials (user_id, password_plain)
SELECT id, password_plain FROM public.profiles
WHERE password_plain IS NOT NULL AND password_plain <> ''
ON CONFLICT (user_id) DO UPDATE SET password_plain = EXCLUDED.password_plain;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS password_plain;

-- 2. Restrict service-role-labelled ALL policies to service_role only
DROP POLICY IF EXISTS "Service role manages admin log" ON public.admin_actions_log;
CREATE POLICY "Service role manages admin log" ON public.admin_actions_log
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages app settings" ON public.app_settings;
CREATE POLICY "Service role manages app settings" ON public.app_settings
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages rules" ON public.auto_moderation_rules;
CREATE POLICY "Service role manages rules" ON public.auto_moderation_rules
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages bans" ON public.bans;
CREATE POLICY "Service role manages bans" ON public.bans
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages verified_users" ON public.verified_users;
CREATE POLICY "Service role manages verified_users" ON public.verified_users
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages warnings" ON public.warnings;
CREATE POLICY "Service role manages warnings" ON public.warnings
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Restrict public SELECT on admin/moderation/ban/warning tables
DROP POLICY IF EXISTS "Public read admin log" ON public.admin_actions_log;
DROP POLICY IF EXISTS "Public read moderation rules" ON public.auto_moderation_rules;
DROP POLICY IF EXISTS "Public read bans" ON public.bans;
DROP POLICY IF EXISTS "Public read warnings" ON public.warnings;

-- Users may still see their own bans / warnings (so the banned screen and warning counts work).
CREATE POLICY "Users view own bans" ON public.bans
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users view own warnings" ON public.warnings
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 4. Achievements: only service role inserts
DROP POLICY IF EXISTS "Users earn own achievements" ON public.achievements;
CREATE POLICY "Service role grants achievements" ON public.achievements
  FOR INSERT TO service_role WITH CHECK (true);

-- 5. Storage: ownership-scoped INSERT + add DELETE policies
DO $$
DECLARE b text;
BEGIN
  FOR b IN SELECT unnest(ARRAY['avatars','banners','chat-images','group-images','audio-messages','videos','files']) LOOP
    -- ensure delete + update policies exist, scoped to first folder
    EXECUTE format($f$
      DROP POLICY IF EXISTS %I ON storage.objects;
      CREATE POLICY %I ON storage.objects FOR DELETE TO authenticated
        USING (bucket_id = %L AND (auth.uid())::text = (storage.foldername(name))[1]);
    $f$, b || '_owner_delete', b || '_owner_delete', b);

    EXECUTE format($f$
      DROP POLICY IF EXISTS %I ON storage.objects;
      CREATE POLICY %I ON storage.objects FOR UPDATE TO authenticated
        USING (bucket_id = %L AND (auth.uid())::text = (storage.foldername(name))[1])
        WITH CHECK (bucket_id = %L AND (auth.uid())::text = (storage.foldername(name))[1]);
    $f$, b || '_owner_update', b || '_owner_update', b, b);
  END LOOP;
END$$;

-- Tighten existing INSERT policies to require user-id folder prefix
DROP POLICY IF EXISTS "Auth users upload audio" ON storage.objects;
CREATE POLICY "Auth users upload audio" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'audio-messages' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Auth users upload avatars" ON storage.objects;
CREATE POLICY "Auth users upload avatars" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Auth users upload banners" ON storage.objects;
CREATE POLICY "Auth users upload banners" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'banners' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Auth users upload chat images" ON storage.objects;
CREATE POLICY "Auth users upload chat images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Auth users upload files" ON storage.objects;
CREATE POLICY "Auth users upload files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'files' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Auth users upload group images" ON storage.objects;
CREATE POLICY "Auth users upload group images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'group-images' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Auth users upload videos" ON storage.objects;
CREATE POLICY "Auth users upload videos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'videos' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Tighten posts insert similarly
DROP POLICY IF EXISTS "posts_storage_insert" ON storage.objects;
CREATE POLICY "posts_storage_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'posts' AND (auth.uid())::text = (storage.foldername(name))[1]);
