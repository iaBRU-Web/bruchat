-- FIX 1: Drop all old conflicting policies and recreate correct ones

-- Groups table
DROP POLICY IF EXISTS "Users can create groups" ON groups;
DROP POLICY IF EXISTS "Members can view their groups" ON groups;
DROP POLICY IF EXISTS "Admins can update their groups" ON groups;
DROP POLICY IF EXISTS "Admins can delete their groups" ON groups;
DROP POLICY IF EXISTS "Auth users create groups" ON groups;
DROP POLICY IF EXISTS "Group admins delete group" ON groups;
DROP POLICY IF EXISTS "Group admins update group" ON groups;
DROP POLICY IF EXISTS "Group members can view group" ON groups;

-- Group members table
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Members can see group members" ON group_members;
DROP POLICY IF EXISTS "Admins can remove members" ON group_members;
DROP POLICY IF EXISTS "Insert group members" ON group_members;
DROP POLICY IF EXISTS "Group members viewable by members" ON group_members;
DROP POLICY IF EXISTS "Users leave or admins remove" ON group_members;

-- Group messages table
DROP POLICY IF EXISTS "Members can insert group messages" ON group_messages;
DROP POLICY IF EXISTS "Members can read group messages" ON group_messages;
DROP POLICY IF EXISTS "Group members read messages" ON group_messages;
DROP POLICY IF EXISTS "Group members send messages" ON group_messages;
DROP POLICY IF EXISTS "Users delete own group messages" ON group_messages;
DROP POLICY IF EXISTS "Users update own group messages" ON group_messages;

-- Groups policies
CREATE POLICY "authenticated_insert_groups" ON groups
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "authenticated_select_groups" ON groups
FOR SELECT TO authenticated
USING (
  is_public = true
  OR created_by = auth.uid()
  OR is_group_member(auth.uid(), id)
);

CREATE POLICY "authenticated_update_groups" ON groups
FOR UPDATE TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "authenticated_delete_groups" ON groups
FOR DELETE TO authenticated
USING (created_by = auth.uid());

-- Group members policies
CREATE POLICY "authenticated_insert_group_members" ON group_members
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM groups WHERE id = group_id AND created_by = auth.uid()
  )
);

CREATE POLICY "authenticated_select_group_members" ON group_members
FOR SELECT TO authenticated
USING (
  is_group_member(auth.uid(), group_id)
);

CREATE POLICY "authenticated_delete_group_members" ON group_members
FOR DELETE TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM group_members gm2
    WHERE gm2.group_id = group_members.group_id
    AND gm2.user_id = auth.uid()
    AND gm2.role = 'admin'
  )
);

-- Group messages policies
CREATE POLICY "authenticated_insert_group_messages" ON group_messages
FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND is_group_member(auth.uid(), group_id)
);

CREATE POLICY "authenticated_select_group_messages" ON group_messages
FOR SELECT TO authenticated
USING (
  is_group_member(auth.uid(), group_id)
);

CREATE POLICY "authenticated_update_group_messages" ON group_messages
FOR UPDATE TO authenticated
USING (sender_id = auth.uid());

CREATE POLICY "authenticated_delete_group_messages" ON group_messages
FOR DELETE TO authenticated
USING (sender_id = auth.uid());