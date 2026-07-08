
-- Bans table
CREATE TABLE public.bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  banned_by text NOT NULL DEFAULT 'Admin',
  reason text DEFAULT '',
  banned_at timestamptz NOT NULL DEFAULT now(),
  unbanned_at timestamptz
);
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read bans" ON public.bans FOR SELECT USING (true);
CREATE POLICY "Service role manages bans" ON public.bans FOR ALL USING (true) WITH CHECK (true);

-- Warnings table
CREATE TABLE public.warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  warned_by text NOT NULL DEFAULT 'Admin',
  reason text DEFAULT '',
  warned_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read warnings" ON public.warnings FOR SELECT USING (true);
CREATE POLICY "Service role manages warnings" ON public.warnings FOR ALL USING (true) WITH CHECK (true);

-- Admin actions log
CREATE TABLE public.admin_actions_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type text NOT NULL,
  target_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  target_content_id text,
  performed_by text NOT NULL DEFAULT 'Admin',
  details jsonb DEFAULT '{}',
  performed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read admin log" ON public.admin_actions_log FOR SELECT USING (true);
CREATE POLICY "Service role manages admin log" ON public.admin_actions_log FOR ALL USING (true) WITH CHECK (true);

-- Auto moderation rules
CREATE TABLE public.auto_moderation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_type text NOT NULL,
  value text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.auto_moderation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read moderation rules" ON public.auto_moderation_rules FOR SELECT USING (true);
CREATE POLICY "Service role manages rules" ON public.auto_moderation_rules FOR ALL USING (true) WITH CHECK (true);

-- App settings table for maintenance mode, announcements etc
CREATE TABLE public.app_settings (
  id text PRIMARY KEY DEFAULT 'global',
  maintenance_mode boolean NOT NULL DEFAULT false,
  maintenance_message text DEFAULT 'BRUChat is currently under maintenance. We will be back shortly.',
  announcement_text text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read app settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Service role manages app settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- Insert default row
INSERT INTO public.app_settings (id) VALUES ('global') ON CONFLICT DO NOTHING;
