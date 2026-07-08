
-- Disable the free-verification promo so no more auto-grants happen
UPDATE public.app_settings SET promo_free_verification = false WHERE id = 'global';

-- Wipe existing verified rows (many were granted by the promo bug) and re-seed the approved accounts
DELETE FROM public.verified_users;

INSERT INTO public.verified_users (user_id, badge_type)
SELECT p.id, 'true'
FROM public.profiles p
WHERE lower(p.username) IN ('bruchat','inezaaimebruno','filsnestor','valentingumanayo','kararansoro','empirekingsun','hirwaemeryblessing')
ON CONFLICT DO NOTHING;
