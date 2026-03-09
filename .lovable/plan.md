

# Next Steps: What to Connect

After reviewing the entire codebase, here's the current status and what needs real connections:

## Already working (connected to database)
- Dashboard, Students, Class History, Progress Tracking, Search — all pull real data
- Import Questionnaire and Import Lessons dialogs — connected to AI + database

## Still using mock data / fake functionality

### 1. Lesson Generator (high priority)
Currently uses a `setTimeout` to fake generation and shows hardcoded mock content. Needs:
- A new edge function `generate-lesson` that receives the student profile + their lesson history + grammar topics, and uses Lovable AI to generate a personalized lesson plan
- The generated lesson should be saveable to the `lessons` table (the "Save Lesson" button does nothing now)
- "Copy Text" button should copy the lesson content to clipboard

### 2. Material Generator (high priority)
Same situation — fake `setTimeout`, hardcoded mock output. Needs:
- A new edge function `generate-material` that takes type, level, topic (and optionally a student's profile for context) and generates real exercises via AI
- "Save" button should insert into the `materials` table
- "Copy" button should copy to clipboard

### 3. Export PDF buttons (lower priority)
Both generators have "Export PDF" buttons that do nothing. Could implement client-side PDF generation later.

## Recommended order

**Start with the Lesson Generator** — it's the core feature of the app. It should:
1. Fetch the selected student's full profile, recent lessons, grammar topics, and vocabulary
2. Send all that context to an AI edge function
3. Stream back a personalized lesson plan matching your lesson structure (Homework Check, Warm Up, Grammar Focus, Exercises, Speaking Task, Homework)
4. Let you save the result as a real lesson in the database

Then do the Material Generator with the same pattern.

## Implementation summary
- **2 new edge functions**: `generate-lesson`, `generate-material` (using Lovable AI gateway with `google/gemini-3-flash-preview`)
- **Update LessonGenerator.tsx**: replace mock with real AI call + save functionality
- **Update MaterialGenerator.tsx**: replace mock with real AI call + save functionality
- No database changes needed — tables already exist

