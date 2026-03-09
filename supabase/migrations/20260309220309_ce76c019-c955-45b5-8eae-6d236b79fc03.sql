ALTER TABLE public.lesson_blocks ADD COLUMN weekly_frequency integer NOT NULL DEFAULT 2;
ALTER TABLE public.lesson_blocks ADD COLUMN class_days text[] NOT NULL DEFAULT '{}'::text[];