
-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  status_text TEXT DEFAULT '',
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  is_banned BOOLEAN DEFAULT false,
  theme TEXT DEFAULT 'dark',
  password_plain TEXT DEFAULT '',
  sound_notifications BOOLEAN DEFAULT true,
  desktop_notifications BOOLEAN DEFAULT false,
  show_typing BOOLEAN DEFAULT true,
  show_read_receipts BOOLEAN DEFAULT true,
  show_online_status BOOLEAN DEFAULT true,
  show_last_seen BOOLEAN DEFAULT true,
  font_size TEXT DEFAULT 'medium',
  bubble_style TEXT DEFAULT 'rounded',
  chat_wallpaper TEXT DEFAULT 'solid',
  profile_views INTEGER DEFAULT 0,
  public_key TEXT DEFAULT '',
  away_status TEXT DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_is_online ON public.profiles(is_online);

-- Conversations table
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  is_muted_a BOOLEAN DEFAULT false,
  is_muted_b BOOLEAN DEFAULT false,
  is_archived_a BOOLEAN DEFAULT false,
  is_archived_b BOOLEAN DEFAULT false,
  is_pinned_a BOOLEAN DEFAULT false,
  is_pinned_b BOOLEAN DEFAULT false,
  disappearing_messages_duration TEXT DEFAULT 'off',
  UNIQUE(participant_a, participant_b)
);
CREATE INDEX idx_conversations_participant_a ON public.conversations(participant_a);
CREATE INDEX idx_conversations_participant_b ON public.conversations(participant_b);

-- Messages table
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  file_name TEXT DEFAULT '',
  file_size BIGINT DEFAULT 0,
  file_type TEXT DEFAULT '',
  message_type TEXT DEFAULT 'text',
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_starred BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  link_preview_url TEXT DEFAULT '',
  link_preview_title TEXT DEFAULT '',
  link_preview_description TEXT DEFAULT '',
  link_preview_image TEXT DEFAULT '',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  encrypted BOOLEAN DEFAULT true
);
CREATE INDEX idx_messages_conversation_created ON public.messages(conversation_id, created_at);

-- Groups table
CREATE TABLE public.groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_public BOOLEAN DEFAULT false,
  max_members INTEGER DEFAULT 500,
  invite_link TEXT UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex'),
  disappearing_messages_duration TEXT DEFAULT 'off'
);
CREATE INDEX idx_groups_created_by ON public.groups(created_by);
CREATE INDEX idx_groups_invite_link ON public.groups(invite_link);

-- Group members table
CREATE TABLE public.group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Group messages table
CREATE TABLE public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  audio_url TEXT DEFAULT '',
  video_url TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  file_name TEXT DEFAULT '',
  file_size BIGINT DEFAULT 0,
  file_type TEXT DEFAULT '',
  message_type TEXT DEFAULT 'text',
  reply_to_id UUID REFERENCES public.group_messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,
  mentions UUID[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT false,
  link_preview_url TEXT DEFAULT '',
  link_preview_title TEXT DEFAULT '',
  link_preview_description TEXT DEFAULT '',
  link_preview_image TEXT DEFAULT '',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_group_messages_group_created ON public.group_messages(group_id, created_at);

-- Group message reads
CREATE TABLE public.group_message_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_message_id UUID NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_message_id, user_id)
);

-- Reactions table
CREATE TABLE public.reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID,
  group_message_id UUID,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji),
  UNIQUE(group_message_id, user_id, emoji)
);

-- Follows table
CREATE TABLE public.follows (
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(follower_id, following_id)
);

-- Blocks table
CREATE TABLE public.blocks (
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(blocker_id, blocked_id)
);

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  from_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);

-- Polls table
CREATE TABLE public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Poll votes table
CREATE TABLE public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- Starred messages table
CREATE TABLE public.starred_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  group_message_id UUID REFERENCES public.group_messages(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Drafts table
CREATE TABLE public.drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, conversation_id),
  UNIQUE(user_id, group_id)
);

-- Reports table
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;

-- Security definer function for group membership check
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id AND group_id = _group_id
  )
$$;

-- Security definer function for conversation participation
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id UUID, _conversation_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversations
    WHERE id = _conversation_id
    AND (participant_a = _user_id OR participant_b = _user_id)
  )
$$;

-- Security definer function for block check
CREATE OR REPLACE FUNCTION public.is_blocked(_blocker UUID, _blocked UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocks
    WHERE blocker_id = _blocker AND blocked_id = _blocked
  )
$$;

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _username TEXT;
  _display_name TEXT;
  _avatar TEXT;
BEGIN
  _display_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name',
    split_part(NEW.email, '@', 1)
  );
  _username := lower(regexp_replace(_display_name, '[^a-zA-Z0-9]', '', 'g'));
  IF _username = '' THEN _username := 'user'; END IF;
  -- Add random suffix if taken
  IF EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) THEN
    _username := _username || floor(random() * 9000 + 1000)::text;
  END IF;
  -- Still taken? add more random
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = _username) LOOP
    _username := _username || floor(random() * 100)::text;
  END LOOP;
  _avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    ''
  );
  INSERT INTO public.profiles (id, username, display_name, avatar_url, created_at)
  VALUES (NEW.id, _username, _display_name, _avatar, now());
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS POLICIES

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own conversations" ON public.conversations FOR SELECT TO authenticated USING (participant_a = auth.uid() OR participant_b = auth.uid());
CREATE POLICY "Users insert own conversations" ON public.conversations FOR INSERT TO authenticated WITH CHECK (participant_a = auth.uid() OR participant_b = auth.uid());
CREATE POLICY "Users update own conversations" ON public.conversations FOR UPDATE TO authenticated USING (participant_a = auth.uid() OR participant_b = auth.uid());
CREATE POLICY "Users delete own conversations" ON public.conversations FOR DELETE TO authenticated USING (participant_a = auth.uid() OR participant_b = auth.uid());

-- Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own conversation messages" ON public.messages FOR SELECT TO authenticated USING (public.is_conversation_participant(auth.uid(), conversation_id));
CREATE POLICY "Users send to own conversations no blocks" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid()
  AND public.is_conversation_participant(auth.uid(), conversation_id)
  AND NOT EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
    AND public.is_blocked(
      CASE WHEN c.participant_a = auth.uid() THEN c.participant_b ELSE c.participant_a END,
      auth.uid()
    )
  )
);
CREATE POLICY "Users update own messages" ON public.messages FOR UPDATE TO authenticated USING (sender_id = auth.uid());
CREATE POLICY "Users delete own messages" ON public.messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- Groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members can view group" ON public.groups FOR SELECT TO authenticated USING (is_public = true OR public.is_group_member(auth.uid(), id));
CREATE POLICY "Auth users create groups" ON public.groups FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Group admins update group" ON public.groups FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Group admins delete group" ON public.groups FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid() AND role = 'admin')
);

-- Group members
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members viewable by members" ON public.group_members FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id));
CREATE POLICY "Insert group members" ON public.group_members FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users leave or admins remove" ON public.group_members FOR DELETE TO authenticated USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.role = 'admin')
);

-- Group messages
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members read messages" ON public.group_messages FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id));
CREATE POLICY "Group members send messages" ON public.group_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND public.is_group_member(auth.uid(), group_id)
);
CREATE POLICY "Users update own group messages" ON public.group_messages FOR UPDATE TO authenticated USING (sender_id = auth.uid());
CREATE POLICY "Users delete own group messages" ON public.group_messages FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- Group message reads
ALTER TABLE public.group_message_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read group message reads" ON public.group_message_reads FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.group_messages gm WHERE gm.id = group_message_id AND public.is_group_member(auth.uid(), gm.group_id))
);
CREATE POLICY "Users insert own reads" ON public.group_message_reads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Reactions
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view reactions" ON public.reactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users add reactions" ON public.reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users remove own reactions" ON public.reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own follows" ON public.follows FOR INSERT TO authenticated WITH CHECK (follower_id = auth.uid());
CREATE POLICY "Users unfollow" ON public.follows FOR DELETE TO authenticated USING (follower_id = auth.uid());

-- Blocks
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own blocks" ON public.blocks FOR SELECT TO authenticated USING (blocker_id = auth.uid());
CREATE POLICY "Users add blocks" ON public.blocks FOR INSERT TO authenticated WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "Users remove blocks" ON public.blocks FOR DELETE TO authenticated USING (blocker_id = auth.uid());

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Polls
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members view polls" ON public.polls FOR SELECT TO authenticated USING (public.is_group_member(auth.uid(), group_id));
CREATE POLICY "Group members create polls" ON public.polls FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND public.is_group_member(auth.uid(), group_id));

-- Poll votes
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members view votes" ON public.poll_votes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.polls p WHERE p.id = poll_id AND public.is_group_member(auth.uid(), p.group_id))
);
CREATE POLICY "Users vote once" ON public.poll_votes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Starred messages
ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own stars" ON public.starred_messages FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users add stars" ON public.starred_messages FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users remove stars" ON public.starred_messages FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Drafts
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own drafts" ON public.drafts FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users add drafts" ON public.drafts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own drafts" ON public.drafts FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own drafts" ON public.drafts FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users submit reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid());
CREATE POLICY "Users view own reports" ON public.reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());
