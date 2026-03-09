
-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- CEFR level enum
CREATE TYPE public.cefr_level AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
CREATE TYPE public.grammar_status AS ENUM ('not_started', 'introduced', 'practicing', 'consolidated', 'needs_review');
CREATE TYPE public.vocab_status AS ENUM ('new', 'practicing', 'consolidated');
CREATE TYPE public.lesson_status AS ENUM ('planned', 'completed', 'cancelled');
CREATE TYPE public.block_status AS ENUM ('active', 'completed', 'paused');
CREATE TYPE public.note_type AS ENUM ('observation', 'evaluation', 'milestone');
CREATE TYPE public.suggestion_type AS ENUM ('grammar', 'speaking', 'review', 'warning', 'tip');
CREATE TYPE public.suggestion_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.material_type AS ENUM ('reading', 'listening', 'grammar_drill', 'speaking_prompt', 'vocabulary_task', 'matching', 'fill_blanks', 'true_false', 'multiple_choice');

-- Students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level cefr_level NOT NULL DEFAULT 'A1',
  age INTEGER,
  profession TEXT,
  interests TEXT[] DEFAULT '{}',
  objectives TEXT[] DEFAULT '{}',
  difficulties TEXT[] DEFAULT '{}',
  strengths TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  avatar TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lesson blocks table
CREATE TABLE public.lesson_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 8,
  objectives TEXT[] DEFAULT '{}',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  lessons_completed INTEGER NOT NULL DEFAULT 0,
  status block_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  block_id UUID REFERENCES public.lesson_blocks(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  objective TEXT NOT NULL DEFAULT '',
  grammar_focus TEXT[] DEFAULT '{}',
  vocabulary_focus TEXT[] DEFAULT '{}',
  warm_up TEXT DEFAULT '',
  homework_check TEXT,
  grammar_explanation TEXT DEFAULT '',
  exercises TEXT[] DEFAULT '{}',
  speaking_task TEXT DEFAULT '',
  homework TEXT DEFAULT '',
  observations TEXT,
  status lesson_status NOT NULL DEFAULT 'planned',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grammar topics table
CREATE TABLE public.grammar_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  status grammar_status NOT NULL DEFAULT 'not_started',
  times_worked INTEGER NOT NULL DEFAULT 0,
  last_worked DATE,
  errors TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Vocabulary items table
CREATE TABLE public.vocabulary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT,
  category TEXT NOT NULL DEFAULT '',
  status vocab_status NOT NULL DEFAULT 'new',
  context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Progress notes table
CREATE TABLE public.progress_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type note_type NOT NULL DEFAULT 'observation',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Materials table
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  type material_type NOT NULL DEFAULT 'reading',
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  level cefr_level NOT NULL DEFAULT 'A1',
  topic TEXT NOT NULL DEFAULT '',
  grammar_focus TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Professional modules table
CREATE TABLE public.professional_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profession TEXT NOT NULL,
  categories JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_modules ENABLE ROW LEVEL SECURITY;

-- RLS policies: each user sees only their own data
CREATE POLICY "Users manage own students" ON public.students FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own lesson_blocks" ON public.lesson_blocks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own lessons" ON public.lessons FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own grammar_topics" ON public.grammar_topics FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own vocabulary" ON public.vocabulary FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own progress_notes" ON public.progress_notes FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own materials" ON public.materials FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users manage own professional_modules" ON public.professional_modules FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lesson_blocks_updated_at BEFORE UPDATE ON public.lesson_blocks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_grammar_topics_updated_at BEFORE UPDATE ON public.grammar_topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vocabulary_updated_at BEFORE UPDATE ON public.vocabulary FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_progress_notes_updated_at BEFORE UPDATE ON public.progress_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_professional_modules_updated_at BEFORE UPDATE ON public.professional_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_students_user_id ON public.students(user_id);
CREATE INDEX idx_lessons_student_id ON public.lessons(student_id);
CREATE INDEX idx_lessons_user_id ON public.lessons(user_id);
CREATE INDEX idx_grammar_topics_student_id ON public.grammar_topics(student_id);
CREATE INDEX idx_vocabulary_student_id ON public.vocabulary(student_id);
CREATE INDEX idx_progress_notes_student_id ON public.progress_notes(student_id);
CREATE INDEX idx_lesson_blocks_student_id ON public.lesson_blocks(student_id);
CREATE INDEX idx_materials_lesson_id ON public.materials(lesson_id);
