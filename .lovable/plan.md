

# Plan: Lesson Blocks, Calendar, and Richer Lesson Generation

## Problems identified

1. **Lesson Blocks are empty and non-functional** — "New Block" button does nothing, no create/mutation hook exists. No way to register that a student paid for 8 classes and track consumption.

2. **No calendar view** — Planned/upcoming lessons have dates but there's no calendar to visualize them. Only a small list on the Dashboard.

3. **Generated lessons are too short** — The AI prompt produces brief paragraph summaries per section. Your actual lesson PDFs are 7 pages with vocabulary tables, reading comprehension texts, multiple structured exercises (fill-in, match, verb hunt), speaking tasks with guided prompts, and detailed homework. The generator needs to match that depth.

## Implementation

### 1. Lesson Block management

**New hook `useLessonBlocks` mutations** — Add `useCreateLessonBlock` and `useUpdateLessonBlock` mutations.

**New `CreateBlockDialog` component** — Form with:
- Student selector
- Block title (e.g., "Paquete Marzo 2026")
- Size (number of classes, default 8)
- Objectives (tag input)
- Start date (datepicker)

**Wire "New Block" button** in `LessonPlans.tsx` to open the dialog.

**Auto-increment `lessons_completed`** — When saving a generated lesson (or marking one as completed), if the lesson's student has an active block, increment `lessons_completed`. Show a warning toast when the block is about to expire (e.g., "Last class of the block!").

**Show block status in StudentDetail** — Add a section showing the active block with progress bar, remaining classes, and a "Renew" button.

### 2. Calendar page

**New `Calendar.tsx` page** (at `/calendar`) — A monthly calendar view using the existing `react-day-picker` component showing:
- Days with planned lessons highlighted
- Click on a day to see lesson details (student, title, time)
- Quick-add lesson from calendar

**Add to sidebar** — Add "Calendar" item to the main nav group.

**Wire lesson dates** — When saving a generated lesson, add a date picker so the teacher can set the scheduled date. Currently it defaults to `CURRENT_DATE`.

### 3. Richer lesson generation

**Rewrite the `generate-lesson` edge function prompt** to produce lessons matching the PDF model structure:

The AI should generate:
- **Homework Check**: Structured review of previous homework with specific sentences to check
- **Today's Language / Vocabulary**: Full vocabulary table with English words, translations, categories (Life & Career, Creative Work, Media, Feelings, etc.)
- **Reading/Listening texts**: 3-4 paragraph texts about real-world topics tailored to interests
- **Exercises** (6-8 structured exercises):
  - Guess/Match activities
  - Verb Hunt
  - Match the Verb with meaning
  - Reading Comprehension questions with space for answers
  - Complete the Sentence (fill-in with verb bank)
  - Question Practice
  - Personal sentences ("You" section)
- **Final Speaking**: Guided conversation with prompt questions and example answers
- **Homework**: Multi-part structured homework (write clues, negative clue, question)

**Update the `GeneratedLesson` interface** to include richer section types (vocabulary tables, exercise arrays with types, reading texts).

**Update `LessonGenerator.tsx` rendering** to display the richer content with proper formatting — tables for vocabulary, numbered exercises, etc.

**Add date picker** to the lesson generator so saved lessons get a future date (making them "upcoming").

### 4. Connect blocks to lesson saving flow

When saving a lesson in the generator:
1. Check if student has an active block
2. If yes, link the lesson to the block (`block_id`) and increment `lessons_completed`
3. If `lessons_completed` reaches `size`, show alert: "Block completed! Student needs to renew."
4. If no active block, show a warning: "No active block for this student"

## Files to create/modify

- **Create**: `src/components/lessons/CreateBlockDialog.tsx`
- **Create**: `src/pages/CalendarPage.tsx`
- **Modify**: `src/hooks/useLessonBlocks.ts` — add create/update mutations
- **Modify**: `src/pages/LessonPlans.tsx` — wire create dialog, show block warnings
- **Modify**: `src/pages/LessonGenerator.tsx` — richer rendering, date picker, block linking
- **Modify**: `src/pages/StudentDetail.tsx` — show active block info
- **Modify**: `src/components/layout/AppSidebar.tsx` — add Calendar nav item
- **Modify**: `src/App.tsx` — add `/calendar` route
- **Modify**: `supabase/functions/generate-lesson/index.ts` — rewrite prompt for extensive lessons

## Order of execution
1. Add lesson block mutations + create dialog
2. Build calendar page + route
3. Rewrite generate-lesson prompt for richer output
4. Update LessonGenerator UI for richer rendering + date picker + block integration
5. Show block status in StudentDetail

