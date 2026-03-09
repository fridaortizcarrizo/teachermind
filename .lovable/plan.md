

# Plan: Block Scheduling, Interactive Calendar, and AI Chat Assistant

## Problems to solve

1. **Block doesn't track frequency/days** — No way to record "2x/week, Mon+Wed". The `lesson_blocks` table lacks `weekly_frequency` and `class_days` columns.
2. **Objectives not syncing** — The CreateBlockDialog saves objectives as comma-separated text but the block's objectives aren't reflected elsewhere (calendar, student detail, lesson generator).
3. **Calendar is view-only** — Clicking a lesson card doesn't navigate anywhere. Lessons need clickable links to their detail/plan.
4. **No lesson detail page** — There's no `/lessons/:id` route to view a single lesson's full content.
5. **No AI chat assistant** — User wants a small floating chat widget to ask the AI to modify data (update block info, mark lessons, etc.).

## Implementation

### 1. Database migration: Add frequency fields to `lesson_blocks`

```sql
ALTER TABLE public.lesson_blocks 
  ADD COLUMN weekly_frequency integer NOT NULL DEFAULT 2,
  ADD COLUMN class_days text[] NOT NULL DEFAULT '{}'::text[];
```

This stores e.g. `weekly_frequency: 2`, `class_days: ['monday', 'wednesday']`.

### 2. Update CreateBlockDialog

- Add "Frecuencia semanal" select (1, 2, 3, 4)
- Add "Días de clase" multi-select checkboxes (Lun, Mar, Mié, Jue, Vie, Sáb)
- Pass both new fields to `useCreateLessonBlock`

### 3. Create LessonDetail page (`/lessons/:id`)

- New route `/lessons/:id` showing the full lesson content (homework check, vocabulary, exercises, speaking, homework)
- Status tag (planned/completed) prominently displayed
- Button to mark as completed (updates status in DB)
- Link back to student profile

### 4. Make Calendar interactive

- Each lesson card in CalendarPage becomes a `<Link to={/lessons/${lesson.id}}>` so clicking navigates to the full lesson
- Add colored status tags (planned = amber, completed = green) already present but make them more prominent
- Show block info (e.g. "Clase 7/8") on each lesson card if linked to a block

### 5. Sync block info across the app

- **StudentDetail**: Show frequency and class days on the active block card (e.g. "2x/sem · Lun, Mié")
- **LessonPlans**: Show frequency/days on each block card
- **Dashboard**: Show next scheduled class day based on block's `class_days`

### 6. Floating AI Chat Widget

- New component `AIChatWidget.tsx` — a small floating button (bottom-right) that expands into a compact chat panel
- Uses a new edge function `chat-assistant` that receives messages + context (current student data, blocks, lessons) and can respond with instructions
- The chat can answer questions about students, suggest modifications, and provide teaching tips
- For now, it's a conversational assistant (read-only actions) — modifying data via chat would require tool-calling which we'll add incrementally
- Rendered in `AppLayout.tsx` so it's available on every page

### 7. Edge function: `chat-assistant`

- Accepts `{ messages, context }` where context includes student names, active blocks, recent lessons
- Uses Lovable AI (`google/gemini-3-flash-preview`) with streaming
- System prompt: "You are TeacherMind, an AI assistant for an English teacher. You help with lesson planning, student progress, and class management. Answer in Spanish."

## Files to create/modify

- **DB migration**: Add `weekly_frequency` and `class_days` to `lesson_blocks`
- **Create**: `src/pages/LessonDetail.tsx`
- **Create**: `src/components/chat/AIChatWidget.tsx`
- **Create**: `supabase/functions/chat-assistant/index.ts`
- **Modify**: `src/components/lessons/CreateBlockDialog.tsx` — add frequency/days fields
- **Modify**: `src/pages/CalendarPage.tsx` — clickable lesson cards with Link
- **Modify**: `src/pages/LessonPlans.tsx` — show frequency/days
- **Modify**: `src/pages/StudentDetail.tsx` — show frequency/days on block card
- **Modify**: `src/components/layout/AppLayout.tsx` — render AIChatWidget
- **Modify**: `src/App.tsx` — add `/lessons/:id` route
- **Modify**: `src/hooks/useLessonBlocks.ts` — no changes needed (types auto-generated)
- **Modify**: `supabase/config.toml` — register `chat-assistant` function

## Order of execution
1. DB migration (add columns)
2. Update CreateBlockDialog with frequency/days
3. Create LessonDetail page + route
4. Make calendar interactive (clickable lessons)
5. Sync block info across pages (StudentDetail, LessonPlans)
6. Create chat-assistant edge function + AIChatWidget
7. Deploy edge function

