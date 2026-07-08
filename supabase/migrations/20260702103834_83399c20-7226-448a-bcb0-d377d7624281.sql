
-- 1. group_members: restrict role and require public group or creator
DROP POLICY IF EXISTS authenticated_insert_group_members ON public.group_members;
CREATE POLICY authenticated_insert_group_members ON public.group_members
FOR INSERT TO authenticated
WITH CHECK (
  (
    user_id = auth.uid()
    AND role = 'member'
    AND EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.is_public = true)
  )
  OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.created_by = auth.uid())
);

-- 2. post_comments anon: only on public posts
DROP POLICY IF EXISTS post_comments_select_anon ON public.post_comments;
CREATE POLICY post_comments_select_anon ON public.post_comments
FOR SELECT TO anon
USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_comments.post_id AND p.is_public = true));

-- Also tighten authenticated select to respect post visibility / ownership
DROP POLICY IF EXISTS post_comments_select ON public.post_comments;
CREATE POLICY post_comments_select ON public.post_comments
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = post_comments.post_id
      AND (p.is_public = true OR p.user_id = auth.uid())
  )
);

-- 3. youtube_likes: restrict select to authenticated
DROP POLICY IF EXISTS yt_likes_select ON public.youtube_likes;
CREATE POLICY yt_likes_select ON public.youtube_likes
FOR SELECT TO authenticated
USING (true);

-- 4. poll_votes: require group membership
DROP POLICY IF EXISTS "Users vote once" ON public.poll_votes;
CREATE POLICY "Users vote once" ON public.poll_votes
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.polls p
    WHERE p.id = poll_votes.poll_id
      AND public.is_group_member(auth.uid(), p.group_id)
  )
);
