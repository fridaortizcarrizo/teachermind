

# Plan: Real Student Data + Add Student Form

## 1. Remove mock data dependency
Delete references to `src/data/mock-data.ts` across pages that still import it (Dashboard, etc.). All data now comes from Supabase hooks.

## 2. Seed Mili & Juli profiles
After the user signs in, we'll provide a way to create the two students via the new Add Student form. Based on your data:

**Mili**: Arquitecta freelance, level A1, age not specified, interests: [arquitectura, rock nacional, series, películas, ciencia ficción], objectives: [Lograr B1, fluidez conversacional, vocabulario arquitectónico], difficulties: [Bloqueo oral, vergüenza al hablar, falta de automatización], strengths: [Vocabulario pasivo, reconoce estructuras, experiencia previa, motivación], notes: detailed pedagogical notes.

**Juli**: From the lesson PDFs — working on A1 Present Simple, interests in pop music/artists (Lali, Sabrina Carpenter, Chappell Roan). Profile details are less complete since you pasted Mili's data under "Juli:" — I'll use what the PDFs reveal.

## 3. Add Student form (Dialog)
Create `src/components/students/AddStudentDialog.tsx` — a modal form matching your Google Forms questionnaire fields:

**Basic info section:**
- Nombre (required)
- Edad
- Ocupación
- Email
- Nivel CEFR (select: A1-C2)

**Questionnaire section** (mapping to DB fields):
- ¿Por qué querés tomar clases? → `objectives[]`
- ¿Objetivo puntual próximos meses? → appended to `objectives[]`
- ¿Qué cosas te gustan? → `interests[]`
- ¿Cómo te sentís con el inglés hoy? → `difficulties[]`
- ¿Disponibilidad? → `notes`
- ¿Clases estructuradas o conversacionales? → `notes`
- ¿Algo que quieras evitar? → `notes`
- ¿Experiencia con clases online? → `notes`
- ¿Algo más? → `notes`
- Fortalezas observadas (teacher fills) → `strengths[]`

The form uses comma/line-separated input for array fields, with zod validation. Calls `useCreateStudent` on submit.

## 4. Wire the "Add Student" button
Update `Students.tsx` to open the dialog when clicking the existing "Add Student" button. After creation, the list auto-refreshes via React Query invalidation.

## Files to create/modify:
- **Create** `src/components/students/AddStudentDialog.tsx` — form dialog
- **Modify** `src/pages/Students.tsx` — wire dialog open state
- **Modify** `src/pages/Dashboard.tsx` — remove any remaining mock data imports

