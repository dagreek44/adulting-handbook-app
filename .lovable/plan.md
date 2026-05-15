# Phase 3 — Collapse `family_members`

`family_members` is a shadow table: every active row duplicates a `users` row in the same family, and every pending row duplicates a `family_invitations` row. We remove it and derive the roster directly from the source-of-truth tables.

## New roster model

For a given `family_id`, the family modal shows:

- **Active members** = `users` rows with that `family_id`, joined to `user_roles` for Parent/Child label.
- **Pending invitations** = `family_invitations` rows with that `family_id` and `status='pending'` (or `'expired'` once past `expires_at`).

No more `family_members` rows, no more `profile_id` linking, no more name/email duplication.

## Code changes (ship first, before the migration)

1. **`src/hooks/useSupabaseData.ts`** — rewrite `fetchFamilyMembers` to:
   - Query `users` (id, first_name, last_name, email, family_id) filtered by current user's `family_id`.
   - Query `user_roles` for those user ids → map to `'Parent' | 'Child'`.
   - Query `family_invitations` for that `family_id` where `status='pending'`; mark expired if `expires_at < now()`.
   - Return the merged shape the modal already expects: `{ id, name, email, role, status }`. For active rows, `id` = `users.id`; for pending rows, `id` = `family_invitations.id`.

2. **`src/components/FamilyMembersModal.tsx`**
   - `handleInvite`: stop inserting into `family_members`. Only insert into `family_invitations` (already done) and capture the desired role on the invitation row (see migration step 1).
   - `removeMember` (active): delete from `users` is not allowed; instead set `users.family_id = NULL` for that user, and delete their `user_roles` entry for this family. Remove all `family_members` logic.
   - `removeMember` (pending/expired): delete the `family_invitations` row only. Remove the `family_members` delete.
   - `resendInvite`: unchanged except no `family_members` touch.

3. **`src/components/Header.tsx`** — anywhere it reads `family_members` for counts/avatars, switch to the same `users`-based query.

4. **`src/services/familyInvitationService.ts`** — `acceptPendingInvitations`:
   - Read the invitation's `family_id` and `role`, update the new user's `users.family_id`, insert into `user_roles`, mark invitation `accepted`. Drop the `family_members` update entirely.

## Migration (single file, runs after code is deployed)

```sql
-- 1. Carry the invited role on the invitation itself
ALTER TABLE public.family_invitations
  ADD COLUMN role text NOT NULL DEFAULT 'Child';

-- 2. Backfill role from family_members for any still-pending invitations
UPDATE public.family_invitations fi
SET role = fm.role
FROM public.family_members fm
WHERE fm.email = fi.invitee_email
  AND fm.family_id = fi.family_id
  AND fi.status = 'pending';

-- 3. Salvage orphan pending family_members (Sarah case) into family_invitations
INSERT INTO public.family_invitations (inviter_id, invitee_email, family_id, status, role)
SELECT
  (SELECT id FROM public.users WHERE family_id = fm.family_id LIMIT 1),
  fm.email, fm.family_id, 'pending', fm.role
FROM public.family_members fm
WHERE fm.profile_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.family_invitations fi
    WHERE fi.invitee_email = fm.email AND fi.family_id = fm.family_id
  );

-- 4. Rewrite handle_user_signup to stop writing family_members
--    (keeps users + user_roles + family_invitations.accept logic only)
CREATE OR REPLACE FUNCTION public.handle_user_signup() ... ;

-- 5. Move the 10-member cap from family_members to users
DROP TRIGGER IF EXISTS enforce_family_member_limit ON public.family_members;

CREATE OR REPLACE FUNCTION public.enforce_family_size_on_users()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.family_id IS NOT NULL AND (
    SELECT count(*) FROM public.users
    WHERE family_id = NEW.family_id AND id <> NEW.id
  ) >= 10 THEN
    RAISE EXCEPTION 'Family is full (10 members maximum)';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER enforce_family_size
BEFORE INSERT OR UPDATE OF family_id ON public.users
FOR EACH ROW EXECUTE FUNCTION public.enforce_family_size_on_users();

-- 6. Drop the table
DROP TABLE public.family_members CASCADE;
```

## Verification

1. Family modal shows the same active members and same pending invites as before.
2. Inviting a new email creates a `family_invitations` row with the chosen role; modal lists it under Pending.
3. Accepting an invite (sign up with invited email) lands the user in the right family with the right role; invitation flips to `accepted`; pending row disappears from modal.
4. Removing an active member clears their `family_id` and removes their parent/child role; they no longer appear; they can be re-invited.
5. Cancelling a pending invitation deletes only the `family_invitations` row.
6. Try to invite an 11th member → trigger raises "Family is full".

## Order

Ship code first, then run the migration in the same message so types regenerate cleanly. Phase 4 (cron cleanup of `notification_outbox`) follows.

## Out of scope

- `friend_group_members` stays — it's the source of truth for friend groups, not a shadow table.
- Merging `family_invitations` and `friend_group_invitations` — deferred per audit.
