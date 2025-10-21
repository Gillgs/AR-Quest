-- Quizzes table setup script
-- Run this in your Supabase SQL editor to create the quizzes table

-- Create the quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id text NOT NULL,
  module_id text NULL,
  title text NOT NULL,
  description text NULL,
  total_questions integer NOT NULL,
  time_limit_minutes integer NULL,
  passing_score integer NULL DEFAULT 70,
  max_attempts integer NULL DEFAULT 3,
  questions_data jsonb NOT NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  image_url text NULL,
  CONSTRAINT quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT quizzes_module_id_fkey FOREIGN KEY (module_id) REFERENCES modules (id)
) TABLESPACE pg_default;

-- Create optimized index for active quizzes lookup
CREATE INDEX IF NOT EXISTS idx_quizzes_module_active_lookup 
ON public.quizzes USING btree (module_id, is_active) 
TABLESPACE pg_default
WHERE (is_active = true);

-- Create additional helpful indexes
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at 
ON public.quizzes USING btree (created_at DESC) 
TABLESPACE pg_default;

-- Create some sample quizzes for testing (optional)
-- Replace module IDs with actual IDs from your modules table

INSERT INTO public.quizzes (id, module_id, title, description, total_questions, time_limit_minutes, passing_score, max_attempts, questions_data, is_active, image_url) VALUES 
(
  'quiz_sample_1', 
  'your_module_id_here', 
  'Basic Concepts Quiz', 
  'Test your understanding of the fundamental concepts covered in this module', 
  5, 
  15, 
  70, 
  3, 
  '{
    "questions": [
      {
        "id": "q1",
        "type": "multiple_choice",
        "question": "What is the main purpose of this module?",
        "options": ["Learning", "Testing", "Practice", "Review"],
        "correct_answer": 0,
        "points": 20
      },
      {
        "id": "q2",
        "type": "multiple_choice",
        "question": "Which concept is most important?",
        "options": ["Concept A", "Concept B", "Concept C", "All concepts"],
        "correct_answer": 3,
        "points": 20
      },
      {
        "id": "q3",
        "type": "true_false",
        "question": "Understanding the basics is essential for progress.",
        "correct_answer": true,
        "points": 20
      },
      {
        "id": "q4",
        "type": "multiple_choice",
        "question": "What should you do after completing this quiz?",
        "options": ["Move to next module", "Review mistakes", "Practice more", "All of the above"],
        "correct_answer": 3,
        "points": 20
      },
      {
        "id": "q5",
        "type": "short_answer",
        "question": "Explain in one sentence what you learned in this module.",
        "sample_answer": "I learned the fundamental concepts and their practical applications.",
        "points": 20
      }
    ],
    "settings": {
      "shuffle_questions": false,
      "shuffle_options": true,
      "show_correct_answers": true,
      "allow_review": true
    }
  }', 
  true, 
  NULL
),
(
  'quiz_sample_2', 
  'your_module_id_here', 
  'Advanced Practice Quiz', 
  'Challenge yourself with more complex questions about advanced topics', 
  3, 
  20, 
  80, 
  2, 
  '{
    "questions": [
      {
        "id": "q1",
        "type": "multiple_choice",
        "question": "Which advanced technique is most effective?",
        "options": ["Technique A", "Technique B", "Technique C", "Combination of all"],
        "correct_answer": 3,
        "points": 33
      },
      {
        "id": "q2",
        "type": "true_false",
        "question": "Advanced concepts build upon basic foundations.",
        "correct_answer": true,
        "points": 33
      },
      {
        "id": "q3",
        "type": "short_answer",
        "question": "Describe how you would apply these advanced concepts in a real-world scenario.",
        "sample_answer": "I would analyze the situation, select appropriate techniques, and implement them systematically.",
        "points": 34
      }
    ],
    "settings": {
      "shuffle_questions": true,
      "shuffle_options": true,
      "show_correct_answers": false,
      "allow_review": false
    }
  }', 
  true, 
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON public.quizzes TO authenticated;
-- GRANT ALL ON public.quizzes TO anon;

-- Note: Update the lessons table foreign key constraint if needed
-- The lessons table already references quizzes in your existing schema