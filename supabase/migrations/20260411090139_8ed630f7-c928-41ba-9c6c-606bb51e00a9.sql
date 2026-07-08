
-- Verified users table
CREATE TABLE public.verified_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  verified_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.verified_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can see verified users" ON public.verified_users FOR SELECT USING (true);

-- Seed bruchat and inezaaimebruno
INSERT INTO public.verified_users (user_id)
SELECT id FROM public.profiles WHERE username IN ('bruchat', 'inezaaimebruno')
ON CONFLICT DO NOTHING;

-- Verification requests table
CREATE TABLE public.verification_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  reviewed_at timestamp with time zone
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON public.verification_requests FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can submit requests" ON public.verification_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
