

# Plan: Sync Blocks with Lessons + Interactive Calendar

## Root cause

1. **Mili's 7 lessons have `block_id: null`** — they were imported before the block was created, so they're not linked. The block shows `lessons_completed: 0` because nothing was ever linked to it.

2. **Calendar shows empty** — Lessons are from Feb-Mar **2025**, but the calendar defaults to today (March **2026**). There's no way to navigate to months with actual data.

## Fix approach

### 1. Compute block progress from actual lessons (not just `lessons_completed` field)

Instead of relying on the static `lessons_completed` counter, **LessonPlans** and **StudentDetail** will count lessons in the DB that match the block's `student_id` and fall within `start_date..end_date` (or `start_date..now` if no end_date). This way existing imported lessons automatically count.

Additionally, run a one-time data fix: update Mili's 7 lessons to set `block_id` to the block's ID, and set `lessons_completed = 7`.

### 2. Fix calendar to show data and be interactive

- **Default to the most recent lesson's month** instead of `new Date()`, so the user sees actual data on load
- **Add a "+" button on empty days** — clicking navigates to `/generate` with the date pre-filled, or to `/history` with a "log past class" flow
- **Clicking a lesson card** already links to `/lessons/:id` (this works, the issue is just that no lessons appear because of the date mismatch)

### 3. Link blocks ↔ lessons ↔ calendar

- In `useLessonBlocks`, add a helper that counts completed lessons per block from the `lessons` table
- In `LessonPlans`, show **real** count from lessons query, not just `lessons_completed`
- When marking a lesson as "dictada" in LessonDetail, also increment the block's `lessons_completed` if the lesson has a `block_id`

### 4. Data migration (one-time fix)

SQL to link Mili's existing lessons to her block:
```sql
UPDATE lessons SET block_id = 'f4f43d04-2597-4fa9-87fd-d70a79e34e74' 
WHERE student_id = '4197692c-fa84-4fa7-a3de-562249867f31' AND block_id IS NULL;

UPDATE lesson_blocks SET lessons_completed = 7 
WHERE id = 'f4f43d04-2597-4fa9-87fd-d70a79e34e74';
```

## Files to modify

- **DB migration**: Link existing lessons to block + update counter
- **`src/pages/CalendarPage.tsx`**: Default to most recent lesson month; add "+" button on empty days to navigate to lesson generator with date pre-set
- **`src/pages/LessonPlans.tsx`**: Compute progress from actual linked lessons count (query lessons where `block_id` matches)
- **`src/pages/LessonDetail.tsx`**: When marking as completed, also increment block counter
- **`src/hooks/useLessonBlocks.ts`**: Add hook to get lessons count per block

## Order
1. Data migration (link lessons to block)
2. Fix CalendarPage (default month, "+" button)
3. Fix LessonPlans (compute real progress)
4. Fix LessonDetail (increment block on completion)

