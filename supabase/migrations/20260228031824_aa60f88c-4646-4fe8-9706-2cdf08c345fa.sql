
-- Fix: Allow creators to see their own groups (before member record exists)
DROP POLICY IF EXISTS "Users can view their groups" ON friend_groups;
CREATE POLICY "Users can view their groups"
ON friend_groups FOR SELECT
USING (
  created_by = auth.uid()
  OR id IN (SELECT get_user_group_ids(auth.uid()))
);

-- Fix: Allow group creators to view members even before their own member record is fully committed
DROP POLICY IF EXISTS "Members can view group members" ON friend_group_members;
CREATE POLICY "Members can view group members"
ON friend_group_members FOR SELECT
USING (
  group_id IN (SELECT get_user_group_ids(auth.uid()))
  OR is_group_creator(auth.uid(), group_id)
);
