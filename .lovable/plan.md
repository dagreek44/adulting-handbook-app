
Fix the stuck dashboard by addressing the real failing path: family invitation lookups, not the core reminder query.

## What’s actually failing

The console evidence points to this sequence:

1. `fetchUserProfile` succeeds from `public.users`
2. `getUserTasks` starts for the correct family
3. The app then runs `acceptPendingInvitations()` and `fetchFamilyMembers()`
4. Both hit `family_invitations`
5. That query throws `42501 permission denied for table users`

This means the app is not blocked because family/group reminder visibility is conceptually wrong. It is blocked because startup is repeatedly calling a failing invitation query.

## Root cause

The current `family_invitations` SELECT policy is the problem:

```sql
invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
```

That policy reads from `auth.users`. Client-side authenticated users should not query `auth.users`, so the policy itself throws `42501`. Postgres reports the underlying relation name as `users`, which made it look like `public.users`, but the successful `fetchUserProfile` call proves `public.users` itself is readable.

Two frontend behaviors then amplify the issue:

- `AuthContext` calls `acceptPendingInvitations()` on every auth event, including refreshes
- `Index.tsx` blocks the whole screen on `supabaseLoading` and `badgesLoading`, even though tasks are the critical data

## Best fix path

### 1) Database: rewrite invitation policies to avoid `auth.users`
Create one migration that updates `family_invitations` RLS:

- Replace the SELECT policy with:
  - `inviter_id = auth.uid() OR invitee_email = auth.email()`
- Replace the INSERT policy so it uses the existing security-definer helper:
  - `family_id = public.get_user_family_id(auth.uid())`
- Keep anon blocked

This removes the broken dependency on `auth.users` and matches the intended rule:
- inviters can see invitations they sent
- invited users can see invitations sent to their own email

### 2) Frontend: stop invitation checks from running in a loop
Update `src/contexts/AuthContext.tsx`:

- Do not call `acceptPendingInvitations()` on every auth event
- Ignore `TOKEN_REFRESHED` for invitation acceptance
- Run invitation acceptance at most once per signed-in session/user
- Keep profile fetch normal, but make invitation acceptance non-blocking

This prevents repeated failed calls from hammering startup.

### 3) Frontend: don’t let auxiliary data freeze the whole dashboard
Update `src/pages/Index.tsx`:

- Full-page loading should depend only on auth readiness + task loading
- `familyMembers` and badges should load independently without blocking the page
- If family members or badges fail, the home/reminders UI should still render

This makes the app resilient even if a secondary query fails later.

### 4) Optional hardening: remove other policy dependencies on raw `users` subqueries
Review and, if needed, migrate these policies to use `public.get_user_family_id(...)` instead of direct `FROM users` subqueries:

- `user_tasks` family checks
- `user_badges` family visibility
- any `family_members` / invitation policies still using direct `users` lookups

This is not the first fix I’d apply, but it is the safest long-term pattern.

## Files to change

- New Supabase migration for `family_invitations` policy cleanup
- `src/contexts/AuthContext.tsx`
- `src/pages/Index.tsx`

## Files likely not needing logic changes

- `src/services/UserTaskService.js` — current family/group visibility model can keep relying on RLS
- `src/contexts/ReminderContext.tsx` — task loading flow is structurally fine
- `src/services/ReminderService.js`

## Expected result after the fix

A signed-in user will:
- see all reminders/tasks for their family
- also see tasks tied to groups they belong to
- stop getting stuck on “Loading your tasks...”
- stop producing `42501 permission denied for table users` during invitation checks

## Verification

After applying the fix:

1. Refresh the web preview and reopen the Android app
2. Confirm console no longer shows:
   - `Error fetching invitations`
   - `42501 permission denied for table users`
3. Confirm dashboard renders even if family member metadata is still loading
4. Confirm reminders list includes:
   - family reminders/tasks
   - group reminders/tasks for active memberships
5. Rebuild the Android app only because frontend files change:
   - `npm run build`
   - `npx cap sync android`
   - reinstall from Android Studio

## Technical details

Recommended SQL direction:

```sql
DROP POLICY IF EXISTS "Inviter and invitee can view invitations" ON public.family_invitations;

CREATE POLICY "Inviter and invitee can view invitations"
ON public.family_invitations
FOR SELECT
TO authenticated
USING (
  inviter_id = auth.uid()
  OR invitee_email = auth.email()
);

DROP POLICY IF EXISTS "Users can create invitations for their family" ON public.family_invitations;

CREATE POLICY "Users can create invitations for their family"
ON public.family_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  inviter_id = auth.uid()
  AND family_id = public.get_user_family_id(auth.uid())
);
```

Recommended UI loading rule:

```text
page blocking = authLoading OR tasksLoading
secondary sections = badgesLoading / familyMembersLoading handled locally
```
