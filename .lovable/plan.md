

# Add Friend Groups and Family Size Limit

## Current Architecture

The app uses a single `family_id` on `users`, `profiles`, `user_tasks`, and `family_members` tables to scope all data. Tasks are fetched by `family_id`, and RLS policies enforce family-based isolation. There is no concept of groups beyond the family.

## Design Decision: How Friend Groups Work

A "friend group" is a separate group (like a family but without the parent/child hierarchy). A user belongs to exactly one family, but can belong to multiple friend groups. Friend groups share reminders/tasks the same way families do -- members can see, create, and complete tasks within the group.

When a user logs in, the Reminders view will show tasks in three sections:
1. **My Tasks** -- tasks assigned directly to the user
2. **Family Tasks** -- tasks from the user's family (current behavior)
3. **Friend Group Tasks** -- tasks from each friend group the user belongs to

## Implementation Plan

### Step 1: Enforce Family Size Limit (max 10)

**Database migration:**
- Create a validation trigger on `family_members` that counts existing members for the `family_id` before INSERT. If count >= 10, raise an exception.

**Frontend change:**
- In `FamilyMembersModal.tsx`, check `familyMembers.length >= 10` before showing the invite button. Show a message like "Family limit reached (10 members max)."

### Step 2: Create Friend Group Tables

**Database migration:**
```text
friend_groups
  id          uuid PK
  name        text
  created_by  uuid (references auth.users)
  max_members int default 10
  created_at  timestamptz
  updated_at  timestamptz

friend_group_members
  id          uuid PK
  group_id    uuid FK -> friend_groups
  user_id     uuid FK -> auth.users (nullable, null = pending invite)
  email       text
  name        text
  role        text default 'member' (creator, member)
  status      text default 'pending' (active, pending, expired)
  invited_by  uuid
  created_at  timestamptz

friend_group_invitations
  id              uuid PK
  group_id        uuid FK -> friend_groups
  inviter_id      uuid
  invitee_email   text
  status          text default 'pending'
  expires_at      timestamptz default now() + 7 days
  created_at      timestamptz
```

**RLS policies:**
- `friend_groups`: Users can view/update groups they are a member of (via `friend_group_members`).
- `friend_group_members`: Members can view other members in their groups. Creators can insert/delete.
- `friend_group_invitations`: Members can view invitations for their groups. Creators can insert.
- Size limit trigger on `friend_group_members` (max 10 per group).

### Step 3: Add `group_id` to `user_tasks`

**Database migration:**
- Add nullable `group_id uuid` column to `user_tasks` referencing `friend_groups(id)`.
- A task belongs to either a family (`family_id`) or a friend group (`group_id`), or just the individual user.

**Update RLS on `user_tasks`:**
- Extend the existing SELECT policy to also allow viewing tasks where `group_id` is in the user's friend groups.
- Extend INSERT/UPDATE/DELETE policies similarly.

### Step 4: Create Friend Group Management UI

**New component: `FriendGroupsModal.tsx`**
- List user's friend groups
- Create a new friend group (name)
- Invite members by email
- View/remove members
- Similar structure to `FamilyMembersModal`

**New component: `FriendGroupSelector.tsx`**
- When creating a custom reminder, allow the user to assign it to a friend group instead of (or in addition to) the family

### Step 5: Update Task Fetching to Include Friend Group Tasks

**`UserTaskService.js`:**
- `getUserTasks()`: After fetching family tasks, also fetch tasks where `group_id` is in any of the user's friend groups. Merge and sort by due date.
- Add a `source` field to each task: `'personal'`, `'family'`, or `'friend_group'` (with group name).

**`ReminderContext.tsx`:**
- Add `friendGroups` to context state.
- Fetch user's friend groups on load.

### Step 6: Update Reminders View with Sections

**`RemindersView.tsx` / `RemindersList.tsx`:**
- Add a "source" filter option (My Tasks / Family / Friend Groups).
- Group tasks visually with section headers when viewing all.

**`RemindersFilter.tsx`:**
- Add filter chips for task source (Personal, Family, each friend group name).

### Step 7: Update Navigation

**`Navigation.tsx`:**
- Add a "Groups" tab or integrate friend group access into the existing Family Members modal.

### Step 8: Add Friend Group to Custom Reminder Creation

**`AddCustomReminder.tsx`:**
- Add a dropdown to select whether the reminder is for: "Just Me", "My Family", or a specific friend group.
- Set `group_id` or `family_id` accordingly on the task.

---

## Technical Summary

| File/Resource | Action | Purpose |
|---|---|---|
| Database migration | Create | `friend_groups`, `friend_group_members`, `friend_group_invitations` tables with RLS |
| Database migration | Alter | Add `group_id` to `user_tasks`, update RLS policies |
| Database trigger | Create | Family member limit (10), friend group member limit (10) |
| `FamilyMembersModal.tsx` | Update | Enforce 10-member limit in UI |
| `FriendGroupsModal.tsx` | Create | Friend group management UI |
| `UserTaskService.js` | Update | Fetch friend group tasks alongside family tasks |
| `ReminderContext.tsx` | Update | Add friend groups to context |
| `RemindersView.tsx` | Update | Show tasks by source (personal/family/group) |
| `RemindersFilter.tsx` | Update | Add source filter |
| `AddCustomReminder.tsx` | Update | Allow assigning to friend group |
| `Navigation.tsx` | Update | Add groups access point |

