-- Lessons table setup script
-- Run this in your Supabase SQL editor to create the lessons table

-- Create the lessons table
CREATE TABLE IF NOT EXISTS public.lessons (
  id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  quiz_id text NULL,
  lesson_data jsonb NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  module_id text NULL,
  is_active boolean NULL DEFAULT true,
  sort_order integer NULL DEFAULT 0,
  content text NULL,
  CONSTRAINT lessons_pkey PRIMARY KEY (id),
  CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE,
  CONSTRAINT lessons_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
) TABLESPACE pg_default;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lessons_module_lookup 
ON public.lessons USING btree (module_id) 
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_lessons_module_sort 
ON public.lessons USING btree (module_id, is_active, sort_order) 
TABLESPACE pg_default
WHERE (is_active = true);

-- Create some sample lessons for testing (optional)
-- Replace module IDs with actual IDs from your modules table

INSERT INTO public.lessons (id, title, description, quiz_id, lesson_data, module_id, is_active, sort_order, content) VALUES 
('lesson_sample_1', 'Introduction to Basic Concepts', 'Learn the fundamental concepts and principles', NULL, '{"duration": 30, "difficulty": "beginner"}', 'your_module_id_here', true, 0, 'Welcome to this introductory lesson where you will learn the basic concepts...'),
('lesson_sample_2', 'Practical Applications', 'Apply what you have learned through hands-on exercises', NULL, '{"duration": 45, "difficulty": "intermediate"}', 'your_module_id_here', true, 1, 'In this lesson, we will explore practical applications and work through examples...')
ON CONFLICT (id) DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON public.lessons TO authenticated;
-- GRANT ALL ON public.lessons TO anon;