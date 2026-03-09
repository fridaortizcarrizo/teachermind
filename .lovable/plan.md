

# Plan: Import System for Questionnaire Responses + PDF Lesson History

## What we're building

Two new features in the Student Detail page, plus seeding Mili & Juli's data:

### 1. "Import Questionnaire" feature
A dialog on the Student Detail (or Add Student) page where you paste the raw text responses from your Google Forms questionnaire. An AI-powered edge function parses the unstructured text and extracts structured fields (name, age, profession, objectives, interests, difficulties, strengths, notes) to create or update a student profile.

**Flow:** Click "Import from Questionnaire" → Paste text → AI parses it → Student profile created/updated

### 2. "Import Class History" (PDF upload)
A dialog on the Student Detail page to upload lesson PDF files. An edge function receives the PDF, parses it using AI, and extracts:
- Individual lessons (title, date, grammar focus, vocabulary, exercises, observations)
- Grammar topics worked on + status
- Vocabulary items with translations
- Progress notes

**Flow:** Click "Import Lessons" → Upload PDF → AI extracts lessons, grammar, vocabulary → Data populates all tabs

### 3. Seed Mili & Juli's profiles
We'll pre-populate the database with both students' data from the information you provided, so the app is immediately personalized.

## Technical implementation

### Database changes
- Add a `storage bucket` for lesson PDF uploads

### New edge functions

**`parse-questionnaire`** — Receives raw pasted text, uses Lovable AI (Gemini 2.5 Flash) to extract structured student data, returns JSON matching the students table schema.

**`parse-lesson-pdf`** — Receives a PDF file, uses Lovable AI to extract structured lesson data (lessons, grammar topics, vocabulary items, progress notes), returns JSON arrays for batch insert.

### New UI components

**`ImportQuestionnaireDialog.tsx`** — Dialog with a large textarea to paste questionnaire responses. Calls the edge function, then creates/updates the student via existing hooks.

**`ImportLessonsDialog.tsx`** — Dialog with file upload for PDFs. Uploads to storage, calls the edge function, then batch-inserts lessons, grammar topics, and vocabulary.

### Modified files

- **`StudentDetail.tsx`** — Add "Import Lessons" button in the header area
- **`Students.tsx`** — Add "Import from Questionnaire" option alongside "Add Student"
- **`AddStudentDialog.tsx`** — Add a tab/toggle for "Paste questionnaire responses" as alternative to manual form

### Data seeding (via insert tool)
Insert both students' profiles with the detailed data you provided:

**Mili:** Arquitecta freelance, A1, interests: [arquitectura, rock nacional, series, películas, ciencia ficción], objectives: [Lograr B1, fluidez conversacional, vocabulario arquitectónico], difficulties: [Bloqueo oral, vergüenza al hablar, falta de automatización], strengths: [Vocabulario pasivo, reconoce estructuras, experiencia previa, motivación genuina]

**Juli (Julieta):** Diseñadora gráfica, A1, age 25, interests: [diseño gráfico, rock argentino, sitcoms, pop, Lali, series], objectives: [Hablar con seguridad en presente, sostener conversación simple], difficulties: [Nivel beginner, necesita consolidar base], strengths: [Motivación, creatividad, intereses claros para material]

Then insert their lesson history extracted from the PDFs:
- **Juli:** 4 lessons (Lesson 1 "This is Me" 11/02, Lesson 2 "My Work, My Routine & My Music" 18/02, Lesson 3 "When She Changes" 27/02, Lesson 4 "People, Stories and Verbs" 04/03)
- **Mili:** 7 lessons (Lesson 1 not in PDF, Lesson 2 "Around the House" 17/02, Lesson 3 "Around the House" 19/02, Lesson 4 "Reading & Spatial Analysis" 24/02, Lesson 5 "Reading & Spatial Analysis" 27/02, Lesson 6 "Understanding Model Reactions" 03/03, Lesson 7 "Month Progress Challenge" 05/03)

Plus grammar topics, vocabulary items, and progress observations extracted from the PDFs for each student.

## Order of execution
1. Create storage bucket for PDFs
2. Seed Mili & Juli profiles + lesson history data
3. Build `parse-questionnaire` edge function
4. Build `parse-lesson-pdf` edge function
5. Create import UI dialogs
6. Wire everything together in Students & StudentDetail pages

