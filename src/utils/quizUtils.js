// Quiz management utility functions
import { supabase, supabaseAdmin } from '../config/supabase.js';

// Helper to pick the best client available (prefer admin/service-role client)
const getClient = () => supabaseAdmin || supabase;

export const quizUtils = {
  // Fetch all quizzes for a specific module
  fetchQuizzesByModule: async (moduleId) => {
    try {
      const client = getClient();
      const { data, error } = await client
        .from('quizzes')
        .select(`
          id,
          module_id,
          title,
          description,
          total_questions,
          passing_score,
          max_attempts,
          questions_data,
          is_active,
          created_at,
          image_url
        `)
        .eq('module_id', moduleId)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching quizzes for module:', moduleId, error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error fetching quizzes:', err);
      return [];
    }
  },

  // Fetch quizzes for multiple modules at once
  fetchQuizzesForModules: async (moduleIds) => {
    if (!moduleIds || moduleIds.length === 0) return {};

    try {
      const client = getClient();
      const { data, error } = await client
        .from('quizzes')
        .select(`
          id,
          module_id,
          title,
          description,
          total_questions,
          passing_score,
          max_attempts,
          questions_data,
          is_active,
          created_at,
          image_url
        `)
        .in('module_id', moduleIds)
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching quizzes for modules:', moduleIds, error);
        return {};
      }

      // Group quizzes by module_id
      const quizzesByModule = {};
      data?.forEach(quiz => {
        if (!quizzesByModule[quiz.module_id]) {
          quizzesByModule[quiz.module_id] = [];
        }
        quizzesByModule[quiz.module_id].push(quiz);
      });

      return quizzesByModule;
    } catch (err) {
      console.error('Unexpected error fetching quizzes for modules:', err);
      return {};
    }
  },

  // Create a new quiz
  createQuiz: async (quizData) => {
    try {
      // Validate required fields
      if (!quizData.title || !quizData.moduleId || !quizData.questions || quizData.questions.length === 0) {
        throw new Error('Quiz must have a title, module ID, and at least one question');
      }

      // Prepare questions data with proper structure
      const questionsData = {
        questions: quizData.questions.map((question, index) => ({
          id: question.id || `q${index + 1}`,
          type: question.type || 'multiple_choice',
          question: question.question,
          options: question.options || [],
          correct_answer: question.correct_answer,
          points: question.points || Math.floor(100 / quizData.questions.length),
          explanation: question.explanation || null,
          image_url: question.image_url || null,
          image_path: question.image_path || null
        })),
        settings: {
          shuffle_questions: quizData.shuffleQuestions || false,
          shuffle_options: quizData.shuffleOptions || true,
          show_correct_answers: quizData.showCorrectAnswers !== false,
          allow_review: quizData.allowReview !== false,
          ...quizData.additionalSettings
        }
      };

      const newQuiz = {
        id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        module_id: quizData.moduleId,
        title: quizData.title,
        description: quizData.description || '',
        total_questions: quizData.questions.length,
  // time_limit_minutes removed
        passing_score: quizData.passingScore || 70,
        max_attempts: quizData.maxAttempts || 3,
        questions_data: questionsData,
        is_active: true,
        image_url: quizData.imageUrl || null
      };

      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('quizzes')
        .insert([newQuiz])
        .select()
        .single();

      if (error) {
        console.error('Error creating quiz:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error creating quiz:', err);
      throw err;
    }
  },

  // Update an existing quiz
  updateQuiz: async (quizId, updates) => {
    try {
      // If updating questions, ensure proper structure
      if (updates.questions) {
        updates.questions_data = {
          questions: updates.questions.map((question, index) => ({
            id: question.id || `q${index + 1}`,
            type: question.type || 'multiple_choice',
            question: question.question,
            options: question.options || [],
            correct_answer: question.correct_answer,
            points: question.points || Math.floor(100 / updates.questions.length),
            explanation: question.explanation || null,
            image_url: question.image_url || null,
            image_path: question.image_path || null
          })),
          settings: updates.settings || {
            shuffle_questions: false,
            shuffle_options: true,
            show_correct_answers: true,
            allow_review: true
          }
        };
        updates.total_questions = updates.questions.length;
        delete updates.questions; // Remove the questions array since we store it in questions_data
        delete updates.settings; // Remove settings since we store it in questions_data
      }

      const client = supabaseAdmin || supabase;
      const { data, error } = await client
        .from('quizzes')
        .update(updates)
        .eq('id', quizId)
        .select()
        .single();

      if (error) {
        console.error('Error updating quiz:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error updating quiz:', err);
      throw err;
    }
  },

  // Delete a quiz (hard delete - completely remove from database)
  deleteQuiz: async (quizId) => {
    try {
      const client = supabaseAdmin || supabase;

      // Use a transaction-like sequence: first null out any lessons that reference this quiz,
      // then delete the quiz. Supabase REST doesn't support multi-statement transactions via the
      // client easily, so we perform the steps and check for errors.

      // 1) Null out lessons.quiz_id that reference this quiz
      const { data: cleared, error: clearErr } = await client
        .from('lessons')
        .update({ quiz_id: null })
        .eq('quiz_id', quizId);

      if (clearErr) {
        console.error('Error clearing lesson references to quiz before delete:', clearErr);
        throw clearErr;
      }

      // 2) Delete the quiz row
      const { data, error } = await client
        .from('quizzes')
        .delete()
        .eq('id', quizId)
        .select()
        .single();

      if (error) {
        console.error('Error deleting quiz after clearing lesson refs:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error deleting quiz:', err);
      throw err;
    }
  },

  // Create sample quizzes for testing/fallback
  createSampleQuizzes: (moduleId, moduleName) => {
    const sampleQuizzes = [
      {
        id: `${moduleId}_quiz_1`,
        module_id: moduleId,
        title: `${moduleName} - Basic Knowledge Check`,
        description: `Test your understanding of basic ${moduleName} concepts`,
  total_questions: 3,
  passing_score: 70,
        max_attempts: 3,
        questions_data: {
          questions: [
            {
              id: 'q1',
              type: 'multiple_choice',
              question: `What is the main focus of ${moduleName}?`,
              options: ['Learning basics', 'Advanced concepts', 'Practical application', 'All of the above'],
              correct_answer: 3,
              points: 33
            },
            {
              id: 'q2',
              type: 'true_false',
              question: `${moduleName} builds upon previously learned concepts.`,
              correct_answer: true,
              points: 33
            },
            {
              id: 'q3',
              type: 'multiple_choice',
              question: `Which approach is best for learning ${moduleName}?`,
              options: ['Reading only', 'Practice only', 'Theory and practice', 'Memorization'],
              correct_answer: 2,
              points: 34
            }
          ],
          settings: {
            shuffle_questions: false,
            shuffle_options: true,
            show_correct_answers: true,
            allow_review: true
          }
        },
        is_active: true,
        created_at: new Date().toISOString(),
        image_url: null
      },
      {
        id: `${moduleId}_quiz_2`,
        module_id: moduleId,
        title: `${moduleName} - Advanced Assessment`,
        description: `Challenge yourself with advanced ${moduleName} questions`,
  total_questions: 2,
  passing_score: 80,
        max_attempts: 2,
        questions_data: {
          questions: [
            {
              id: 'q1',
              type: 'short_answer',
              question: `Explain how you would apply ${moduleName} concepts in a real-world scenario.`,
              sample_answer: `I would analyze the situation, apply the relevant concepts systematically, and evaluate the results.`,
              points: 50
            },
            {
              id: 'q2',
              type: 'multiple_choice',
              question: `What is the most important skill developed through ${moduleName}?`,
              options: ['Critical thinking', 'Problem solving', 'Communication', 'All of these'],
              correct_answer: 3,
              points: 50
            }
          ],
          settings: {
            shuffle_questions: true,
            shuffle_options: true,
            show_correct_answers: false,
            allow_review: false
          }
        },
        is_active: true,
        created_at: new Date().toISOString(),
        image_url: null
      }
    ];

    return sampleQuizzes;
  },

  // Helper function to validate question structure
  validateQuestion: (question) => {
    if (!question.question || question.question.trim() === '') {
      return 'Question text is required';
    }

    switch (question.type) {
      case 'multiple_choice':
        if (!question.options || question.options.length < 2) {
          return 'Multiple choice questions must have at least 2 options';
        }
        if (question.correct_answer === undefined || question.correct_answer < 0 || question.correct_answer >= question.options.length) {
          return 'Valid correct answer index is required for multiple choice questions';
        }
        break;
      case 'true_false':
        if (typeof question.correct_answer !== 'boolean') {
          return 'True/false questions must have a boolean correct answer';
        }
        break;
      case 'short_answer':
        // Short answer questions are flexible, just need the question text
        break;
      default:
        return 'Unknown question type';
    }

    return null; // No validation errors
  },

  // Helper function to validate entire quiz structure
  validateQuiz: (quizData) => {
    const errors = [];

    if (!quizData.title || quizData.title.trim() === '') {
      errors.push('Quiz title is required');
    }

    if (!quizData.moduleId) {
      errors.push('Module ID is required');
    }

    if (!quizData.questions || quizData.questions.length === 0) {
      errors.push('Quiz must have at least one question');
    } else {
      quizData.questions.forEach((question, index) => {
        const questionError = quizUtils.validateQuestion(question);
        if (questionError) {
          errors.push(`Question ${index + 1}: ${questionError}`);
        }
      });
    }

    // time limit validation removed (feature removed)

    if (quizData.passingScore && (quizData.passingScore < 0 || quizData.passingScore > 100)) {
      errors.push('Passing score must be between 0 and 100');
    }

    if (quizData.maxAttempts && (quizData.maxAttempts < 1 || quizData.maxAttempts > 10)) {
      errors.push('Max attempts must be between 1 and 10');
    }

    return errors;
  }
};

export default quizUtils;
