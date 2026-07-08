
-- Add view_once and scheduling columns to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_view_once boolean DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_view_once_opened boolean DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_scheduled boolean DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS scheduled_for timestamptz DEFAULT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS scheduled_status text DEFAULT 'pending';

-- Add slow_mode_duration to groups
ALTER TABLE groups ADD COLUMN IF NOT EXISTS slow_mode_duration integer DEFAULT 0;

-- Update groups RLS to allow public group visibility
DROP POLICY IF EXISTS "authenticated_select_groups" ON groups;
CREATE POLICY "authenticated_select_groups" ON groups
FOR SELECT TO authenticated
USING (
  is_public = true
  OR created_by = auth.uid()
  OR is_group_member(auth.uid(), id)
);
