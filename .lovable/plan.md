# Database Cleanup & Consolidation — Implementation Plan

Execute the 4 phases from the audit. Each phase = one code PR + (where needed) one migration, shipped sequentially so we can verify before moving on.

## Phase 1 — Code-only standardization (no schema change)

Goal: stop reading from `profiles` everywhere, and make `user_tasks` fall back to `reminders` content for template-linked tasks.

**Files to change (reads of `profiles` → `users`):**
- `src/services/userProfileService.ts` — `fetchUserProfile` reads from `users` only; `createUserProfile` stops inserting/updating `profiles` (still writes `first_login` there for now until Phase 2 moves the column). Keep `completeOnboarding` pointed at `profiles` until Phase 2.
- `src/services/familyInvitationService.ts` — drop the `profiles.family_id` update; only update `users` and `family_members`.
- `src/contexts/ReminderContext.tsx`, `src/components/AddCustomReminder.tsx`, `src/components/RemindersView.tsx`, `src/components/FamilyMembersModal.tsx`, `src/services/UserTaskService.js` — replace `from('profiles')` lookups with `from('users')` (same `id`, `family_id`, `first_name`, `last_name`, `username` columns exist on both).

**user_tasks → reminders fallback:**
- In `src/services/UserTaskService.js` (and any reminder-detail read path), when fetching a `user_tasks` row that has `reminder_id`, also fetch the linked `reminders` row and merge: for each of `description, difficulty, estimated_time, estimated_budget, video_url, instructions, tools, supplies, why`, prefer the `user_tasks` value when non-null/non-empty, else fall back to `reminders`. Pure UI consumers (`TaskDetailModal`, `ReminderEditMode`) need no changes — they receive merged objects.

**Verification:** sign in, open dashboard, family modal, a template reminder, a custom reminder, accept-invite flow. All should still work and show the same data.

## Phase 2 — Consolidate `profiles` into `users`

**Migration (single file):**
1. `ALTER TABLE public.users ADD COLUMN first_login boolean DEFAULT true;`
2. Backfill: `UPDATE users u SET first_login = p.first_login FROM profiles p WHERE p.id = u.id;`
3. Migrate the one orphan profile (Sarah, `c0f3804f...`) into `users` if her auth user still exists; otherwise leave it — dropping `profiles` removes it.
4. Rewrite `handle_user_signup` to stop inserting into `profiles`.
5. `DROP FUNCTION public.handle_new_user();` (verify it has no trigger first via `pg_trigger`; if a trigger exists on `auth.users` pointing at it, drop the trigger too).
6. `DROP TABLE public.profiles CASCADE;`

**Code:**
- `src/services/userProfileService.ts` — `completeOnboarding` updates `users.first_login`. Remove the remaining `profiles` insert in `createUserProfile`.
- Remove any leftover `profiles` references surfaced by a repo-wide grep.

**Verification:** new signup creates a `users` row with `first_login=true`, onboarding flips it to false, no `profiles` references remain.

## Phase 3 — Collapse `family_members`

**Code first** (so the table can be dropped safely):
- `src/components/FamilyMembersModal.tsx`, `src/components/Header.tsx`, `src/services/familyInvitationService.ts` — derive the family roster from `users` (joined family) + `user_roles` (role) + `family_invitations` (pending, not yet signed up). Pending invitees are shown by their `family_invitations` row instead of a `family_members` shadow row.
- Remove the `family_members` update in `acceptPendingInvitations`.

**Migration:**
1. Insert any `family_members` row that has no matching `users.id` for its family into `family_invitations` as `status='pending'` (just the 1 known case — Sarah).
2. Update `handle_user_signup` to stop writing `family_members`.
3. Drop trigger `enforce_family_member_limit` and re-implement the 10-member cap as a trigger on `users` (count rows with the same `family_id` before insert/update).
4. `DROP TABLE public.family_members CASCADE;`

**Verification:** family modal shows the same members + pending invites; invite flow still works; 10-member cap still enforced (manual test by attempting 11th invite).

## Phase 4 — Hygiene

- Add a `pg_cron` job (or extend the existing notification cron) to `DELETE FROM notification_outbox WHERE status='sent' AND sent_at < now() - interval '30 days';` daily.
- Optional one-shot: `UPDATE user_tasks SET <field> = NULL FROM reminders r WHERE user_tasks.reminder_id = r.id AND user_tasks.<field> IS NOT DISTINCT FROM r.<field>;` for each of the 9 mirrored fields, so future template edits propagate. Run only after Phase 1 fallback is confirmed working in production.

## Order of execution & rollback

Ship in order: 1 → 2 → 3 → 4. Each phase is independently revertable via Lovable history. Phases 2 and 3 each combine one migration + one code change in the same message so types regenerate cleanly.

## Out of scope

- Merging `family_invitations` with `friend_group_invitations` (audit item 3) — duplication is small, policies differ, defer.
- Touching `reminders`, `user_badges`, `user_roles`, `device_tokens`, friend-group tables — all clean.

Confirm and I'll start with Phase 1 (code-only, lowest risk).