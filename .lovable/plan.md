

## Diagnosis

Token registration works on Android — confirmed. The new symptom (dashboard hangs at "Loading your tasks") is a database-side regression caused by the recent security migration.

The audit logs show non-stop `permission denied for table users` (42501) errors. I confirmed why:

```
SELECT grantee, privilege_type
  FROM information_schema.role_table_grants
 WHERE table_schema='public' AND table_name='users';
→ []   ← zero rows
```

The `authenticated` role has **no GRANTs** on `public.users` at all. A previous "lock down PII" pass revoked them. Without table-level GRANT, Postgres rejects the query at the privilege layer **before RLS is ever evaluated**. So every one of these breaks:

- `users` direct SELECT (e.g. `fetchUserProfile`, `acceptPendingInvitations`, `getUserTasks` first call, `useBadges`)
- The PostgREST embed `assignee:users!user_tasks_user_id_fkey(...)` in `getUserTasks` and `getCompletedTasks`
- RLS policies on **other** tables whose USING clauses contain `SELECT … FROM users` — the subquery runs as the caller, hits 42501, and the whole row read fails:
  - `user_tasks` ("Users can view family and group tasks")
  - `user_badges` ("Users can view family badges")
  - `family_invitations` ("Users can create invitations…")
  - `family_members` (delete policy)

Net effect on the dashboard: `getUserTasks` returns `[]` quickly because of its catch, BUT `useSupabaseData.fetchFamilyMembers` keeps calling `family_invitations` (also 42501) and the loading flag for that hook only flips when its first call settles. On the device the auth listener fires multiple `SIGNED_IN` / `INITIAL_SESSION` / `TOKEN_REFRESHED` events; each one re-runs `handleUserProfileFetch` → `acceptPendingInvitations`, which calls `family_invitations` (42501) and `family_members` insert (also touches `users` RLS → 42501) on a 0-ms `setTimeout`, creating a tight retry storm. That's what's keeping the WebView pegged and the spinner spinning.

The previous policy I dropped on `family_invitations` removed *one* `users` reference — but the underlying problem (authenticated cannot read `users` at all) was never fixed and many other policies still depend on it.

## Fix

Single migration. Restore the standard grants on `public.users` to `authenticated`, then rely on RLS (which is already correct: own row + family members) to do the access control. This is the normal Supabase pattern — RLS without GRANT is a no-op that surfaces as 42501.

```sql
-- Allow the authenticated role to access public.users at the privilege layer.
-- RLS policies already restrict rows to: own record OR same family.
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Keep anon explicitly locked out (already covered by RLS deny policies,
-- but make the privilege layer match).
REVOKE ALL ON public.users FROM anon;
```

That's it. No code changes required. After this:

- `fetchUserProfile`, `getUserTasks`, badges, family members, invitations all start returning real data.
- `permission denied for table users` errors stop in both the client console and Postgres logs.
- The "Loading your tasks…" spinner clears on Android.

## Verification after the migration

1. Reinstall is **not** required (DB-only change).
2. Pull-to-refresh / re-open the app; dashboard should populate within 1–2 seconds.
3. Browser console: no more `42501` rows.
4. `select count(*) from postgres_logs where event_message='permission denied for table users' and timestamp > now() - interval '5 minutes'` → 0.

## What I will NOT touch

- RLS policies — the existing ones already correctly restrict `users` to own row + same family. The bug is the missing GRANT, not the policies.
- Any application code (`UserTaskService`, `useBadges`, `AuthContext`, `useSupabaseData`).
- Capacitor / Android / push notification code — that side is now working.

## Files to change

- One new Supabase migration (the GRANT/REVOKE above).

