
CREATE TABLE public.lesson_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  draft_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  chat_messages jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_prev_lesson_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own lesson_drafts"
  ON public.lesson_drafts
  FOR ALL
  TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_lesson_drafts_updated_at
  BEFORE UPDATE ON public.lesson_drafts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
