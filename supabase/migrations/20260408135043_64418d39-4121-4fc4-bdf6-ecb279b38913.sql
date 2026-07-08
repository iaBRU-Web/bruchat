
CREATE TABLE public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own AI messages"
ON public.ai_chat_messages FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users insert own AI messages"
ON public.ai_chat_messages FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own AI messages"
ON public.ai_chat_messages FOR DELETE
TO authenticated
USING (user_id = auth.uid());

CREATE INDEX idx_ai_chat_messages_user ON public.ai_chat_messages(user_id, created_at);
