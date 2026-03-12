

# Plan: Persistent Lesson Drafts + Fix Save Flow

## Problems Found

1. **The lesson IS saved** — I found "On-Site Decisions: Managing the Workshed" in the DB from March 11. It appears in class history/calendar but with **wrong date** (2024-05-24) because the AI generated "24/05/2024" instead of 2026. So it shows up in a month nobody navigates to.

2. **Drafts are lost on navigation** — all state lives in `useState`. If you leave the page, everything disappears.

3. **Saved lesson doesn't link to the active block** — so it won't count toward block progress.

## Fix

### 1. Create `lesson_drafts` table
Store in-progress drafts so they survive navigation and page reloads.

```
lesson_drafts: id, user_id, student_id, draft_json (jsonb), 
               chat_messages (jsonb), updated_at, created_at
```

### 2. Auto-save draft (debounced)
Every time the draft or chat changes, auto-save to `lesson_drafts` after 2 seconds of inactivity. On page load, check for existing drafts and offer to resume.

### 3. Fix the save flow in LessonGenerator
- **Date**: Default to today's date (ignore AI-generated date which is often wrong). Allow user to pick a date before saving.
- **Block linking**: When saving, find the student's active block and set `block_id` automatically.
- **Invalidate queries**: After save, invalidate lessons + block counts so calendar and student profile update immediately.
- **Delete the draft** from `lesson_drafts` after successful save.

### 4. Fix the wrong-date lesson already in DB
Update the existing lesson with date 2024-05-24 to a correct date (2026-03-11, when it was created).

## Files to create/modify
- **DB migration**: Create `lesson_drafts` table with RLS
- **Data fix**: Update the wrong-date lesson
- **`src/hooks/useLessonDrafts.ts`**: New hook for CRUD on drafts + auto-save logic
- **`src/pages/LessonGenerator.tsx`**: Load/resume drafts on mount, auto-save on changes, fix save flow (date picker, block linking, delete draft after save), show "resume draft" UI if one exists

## Order
1. DB migration + data fix
2. Create `useLessonDrafts` hook
3. Update LessonGenerator with auto-save + resume + fixed save

