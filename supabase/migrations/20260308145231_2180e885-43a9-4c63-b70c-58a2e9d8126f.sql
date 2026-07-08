
-- Fix overly permissive RLS policies

-- Fix group_members INSERT - allow admins to add members or users to join themselves
DROP POLICY "Insert group members" ON public.group_members;
CREATE POLICY "Insert group members" ON public.group_members FOR INSERT TO authenticated WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
);

-- Fix notifications INSERT - only allow inserting notifications from self
DROP POLICY "Users insert notifications" ON public.notifications;
CREATE POLICY "Users insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (from_user_id = auth.uid());

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES ('avatars', 'avatars', true, 2097152);
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES ('banners', 'banners', true, 3145728);
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES ('chat-images', 'chat-images', true, 5242880);
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES ('group-images', 'group-images', true, 5242880);
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES ('audio-messages', 'audio-messages', true, 10485760);
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES ('videos', 'videos', true, 52428800);
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES ('files', 'files', true, 20971520);

-- Storage RLS policies
CREATE POLICY "Auth users upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth users upload banners" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'banners');
CREATE POLICY "Anyone view banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
CREATE POLICY "Auth users upload chat images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chat-images');
CREATE POLICY "Anyone view chat images" ON storage.objects FOR SELECT USING (bucket_id = 'chat-images');
CREATE POLICY "Auth users upload group images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'group-images');
CREATE POLICY "Anyone view group images" ON storage.objects FOR SELECT USING (bucket_id = 'group-images');
CREATE POLICY "Auth users upload audio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'audio-messages');
CREATE POLICY "Anyone view audio" ON storage.objects FOR SELECT USING (bucket_id = 'audio-messages');
CREATE POLICY "Auth users upload videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos');
CREATE POLICY "Anyone view videos" ON storage.objects FOR SELECT USING (bucket_id = 'videos');
CREATE POLICY "Auth users upload files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'files');
CREATE POLICY "Anyone view files" ON storage.objects FOR SELECT USING (bucket_id = 'files');
