## Goal

Bring all 102 rows in `public.reminders` up to (and slightly above) the gold-standard format set by `Test Smoke Detectors` (`991ab26a...`), so that every reminder has meaningful, field-specific content the UI can render.

No application code or schema will change. This is data-only work via the Supabase insert/update tool. Reminders RLS already allows reads to authenticated users — clients will pick up updated content on next fetch with no rebuild.

## Target shape per row

Every row will end with:

- `why` — 1–3 sentence paragraph explaining the real-world consequence of skipping the task (required everywhere, including the gold-standard row, which is currently missing this).
- `description` — short one-liner if missing.
- `difficulty` — one of `Easy` / `Medium` / `Hard`.
- `estimated_time` — human-readable (e.g. `30 min`, `1–2 hrs`).
- `estimated_budget` — string in the existing `$<low>-<high>` format (e.g. `$15-20`). For zero-cost tasks: `$0`.
- `instructions` — `text[]` with at least 4 clear, ordered steps.
- `tools` — `jsonb` array of `{"name": string, "required": boolean}`.
- `supplies` — `jsonb` array of `{"name": string, "estimatedCost": string, "amazonUrl": string}` using the existing Amazon affiliate deep-link convention already used in app.
- `video_url` — a real, working YouTube URL relevant to the task (verified before writing).
- `subcategory` — replace weak values like `General` / blank with a meaningful one from the existing taxonomy for that `main_category`.

For purely administrative tasks (e.g. “Review bank statements”, “File taxes”) where physical tools/supplies don’t apply, `tools` and `supplies` will contain useful digital equivalents (e.g. `Budgeting app`, `Document scanner app`, `Fireproof document folder`) rather than empty arrays, so the UI never shows blank sections.

## Current gaps (verified just now)

- `why`: missing on **102 / 102** rows (including the gold standard).
- Stub rows (missing video + tools + supplies + weak instructions): **~75** rows, almost all in `Household`.
- `Household / General`: 14 rows with weak subcategory + zero metadata — these will be re-classified into `Appliances`, `Plumbing`, `HVAC`, `Exterior`, `Safety`, `Cleaning`, or `Electrical` based on title, then backfilled.
- Non-Household categories (Health, Finance, Family, Life, Work, etc.): mostly already have `instructions`, `budget`, `time`, `difficulty`. They primarily need `why` plus, for ~20 rows, tools/supplies/video.

## Pass plan

The work will be done in batched SQL `UPDATE` statements via the insert tool, grouped to keep each call reviewable.

### Pass 1 — Re-classify Household / General (14 rows)
Move each `Household / General` row to its correct subcategory based on its title. No content backfill yet — just `subcategory` correction so Pass 2 batches are clean.

### Pass 2 — Household full backfill (~66 rows)
Process Household rows in subcategory batches:

1. Appliances (4)
2. Cleaning (3)
3. Electrical (2)
4. Exterior (16) — split into 2 batches of 8
5. HVAC (10)
6. Plumbing (11)
7. Safety (6)
8. Re-classified former-General rows (14) — alongside their new subcategory’s batch where it fits

For each row in a batch, set: `why`, `instructions` (4–8 steps), `tools`, `supplies`, `estimated_budget`, `video_url`, and tighten `description` / `difficulty` / `estimated_time` if weak. Each YouTube URL is verified by fetching the watch page and confirming the title matches the task before writing.

### Pass 3 — Non-Household categories (~36 rows)
For each row: always set `why`. Where `tools` / `supplies` / `video_url` / `instructions` are missing or thin, fill them with category-appropriate content (digital tools count). Categories covered:

- Family / Shared Responsibilities (6)
- Finance & Legal (8)
- Health & Self-care (8)
- Life & Personal Development (~6)
- Work / Career (~3)
- Any remaining miscellaneous (~5)

### Pass 4 — Verification query
A single read-only audit query confirms zero rows remain with: missing `why`, empty `instructions`, empty `tools`, empty `supplies`, missing `video_url`, missing `estimated_budget`, or weak subcategory.

## QA / safety

- All writes are `UPDATE` statements scoped by primary key — no row is created, deleted, or moved between families.
- No schema migration. No RLS change. No frontend code change.
- Amazon URLs follow the existing affiliate deep-link pattern already in use (per `mem://features/amazon-affiliate-deep-links`).
- YouTube URLs are validated by HTTP fetch and title match before being written; only `youtube.com/watch?v=...` form is used (matches `mem://features/embedded-video-player`).
- Existing meaningful content is preserved — `UPDATE` statements only set fields that are currently null/empty/weak, except for `why`, which is set on every row (including the gold standard) since none currently have it.

## Deliverable

After the four passes, every reminder row will populate every UI section (overview, why-it-matters, steps, tools, supplies, video, budget) with relevant content, and the audit query will return zero deficient rows.

## Estimated size of work

- ~102 row updates across ~12 batched SQL statements.
- ~75 YouTube URL lookups (verified before write).
- No code changes, no rebuild, no app restart required — refreshing the reminders list in the app will surface the new content immediately.
