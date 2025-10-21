import { supabase } from '../config/supabase';

export const progressUtils = {
  /**
   * Fetch unified student progress data using lesson_completions and quiz_attempts tables
   * @param {string} studentId - The student's ID
   * @param {string} moduleId - Optional module ID to filter by specific module
   * @returns {Promise<Object>} Progress data with lessons and quizzes
   */
  async fetchStudentProgress(studentId, moduleId = null) {
    try {
      // Lesson completions query
      let lessonQuery = supabase
        .from('lesson_completions')
        .select(`
          lesson_id,
          completed_at,
          lessons!inner(
            id,
            title,
            description,
            module_id,
            duration_minutes,
            sort_order,
            modules!inner(
              id,
              name,
              subject_id,
              subjects!inner(
                id,
                name
              )
            )
          )
        `)
        .eq('student_id', studentId);

      if (moduleId) {
        lessonQuery = lessonQuery.eq('lessons.module_id', moduleId);
      }

      const { data: lessonCompletions, error: lessonError } = await lessonQuery;

      // Quiz attempts query
      let quizQuery = supabase
        .from('quiz_attempts')
        .select(`
          quiz_id,
          score,
          correct_answers,
          total_questions,
          attempt_number,
          completed_at,
          quizzes!inner(
            id,
            title,
            description,
            module_id,
            total_questions,
            passing_score,
            max_attempts,
            modules!inner(
              id,
              name,
              subject_id,
              subjects!inner(
                id,
                name
              )
            )
          )
        `)
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false });

      if (moduleId) {
        quizQuery = quizQuery.eq('quizzes.module_id', moduleId);
      }

      const { data: quizAttempts, error: quizError } = await quizQuery;

      if (lessonError) console.error('Lesson completions error:', lessonError);
      if (quizError) console.error('Quiz attempts error:', quizError);

      return {
        lessonCompletions: lessonCompletions || [],
        quizAttempts: quizAttempts || [],
        error: lessonError || quizError
      };

    } catch (error) {
      console.error('Error fetching student progress:', error);
      return {
        lessonCompletions: [],
        quizAttempts: [],
        error
      };
    }
  },

  /**
   * Fetch class-wide progress summary for teachers
   * @param {Array} studentIds - Array of student IDs in the class
   * @param {string} moduleId - Optional module ID to filter by specific module
   * @returns {Promise<Object>} Aggregated progress data for the class
   */
  async fetchClassProgress(studentIds, moduleId = null) {
    try {
      if (!studentIds || studentIds.length === 0) {
        return {
          lessonStats: [],
          quizStats: [],
          error: null
        };
      }

      // Get all lessons for the module(s)
      let lessonsQuery = supabase
        .from('lessons')
        .select(`
          id,
          title,
          description,
          module_id,
          duration_minutes,
          sort_order,
          modules!inner(
            id,
            name,
            subject_id
          )
        `)
        .eq('is_active', true);

      if (moduleId) {
        lessonsQuery = lessonsQuery.eq('module_id', moduleId);
      }

      const { data: lessons, error: lessonsError } = await lessonsQuery;

      // Get all lesson completions for these students
      let completionsQuery = supabase
        .from('lesson_completions')
        .select(`
          student_id,
          lesson_id,
          completed_at
        `)
        .in('student_id', studentIds);

      const { data: completions, error: completionsError } = await completionsQuery;

      // Get all quizzes for the module(s)
      let quizzesQuery = supabase
        .from('quizzes')
        .select(`
          id,
          title,
          description,
          module_id,
          total_questions,
          passing_score,
          max_attempts,
          modules!inner(
            id,
            name,
            subject_id
          )
        `)
        .eq('is_active', true);

      if (moduleId) {
        quizzesQuery = quizzesQuery.eq('module_id', moduleId);
      }

      const { data: quizzes, error: quizzesError } = await quizzesQuery;

      // Get all quiz attempts for these students
      let attemptsQuery = supabase
        .from('quiz_attempts')
        .select(`
          student_id,
          quiz_id,
          score,
          correct_answers,
          total_questions,
          attempt_number,
          completed_at
        `)
        .in('student_id', studentIds);

      const { data: attempts, error: attemptsError } = await attemptsQuery;

      // Process lesson statistics
      const lessonStats = (lessons || []).map(lesson => {
        const lessonCompletions = (completions || []).filter(c => c.lesson_id === lesson.id);
        const completionRate = studentIds.length > 0 ? (lessonCompletions.length / studentIds.length) * 100 : 0;

        return {
          ...lesson,
          completedBy: lessonCompletions.length,
          totalStudents: studentIds.length,
          completionRate: Math.round(completionRate),
          completions: lessonCompletions
        };
      });

      // Process quiz statistics
      const quizStats = (quizzes || []).map(quiz => {
        const quizAttempts = (attempts || []).filter(a => a.quiz_id === quiz.id);
        const studentAttempts = {};
        
        // Group attempts by student
        quizAttempts.forEach(attempt => {
          if (!studentAttempts[attempt.student_id]) {
            studentAttempts[attempt.student_id] = [];
          }
          studentAttempts[attempt.student_id].push(attempt);
        });

        // Calculate best scores per student
        const bestScores = Object.keys(studentAttempts).map(studentId => {
          const studentAtts = studentAttempts[studentId];
          return Math.max(...studentAtts.map(a => a.score));
        });

        const averageScore = bestScores.length > 0 ? bestScores.reduce((a, b) => a + b, 0) / bestScores.length : 0;
        const passedCount = bestScores.filter(score => score >= quiz.passing_score).length;
        const attemptedCount = Object.keys(studentAttempts).length;

        return {
          ...quiz,
          averageScore: Math.round(averageScore),
          passedCount,
          attemptedCount,
          totalStudents: studentIds.length,
          attemptRate: studentIds.length > 0 ? (attemptedCount / studentIds.length) * 100 : 0,
          passRate: attemptedCount > 0 ? (passedCount / attemptedCount) * 100 : 0,
          studentAttempts
        };
      });

      return {
        lessonStats,
        quizStats,
        error: lessonsError || completionsError || quizzesError || attemptsError
      };

    } catch (error) {
      console.error('Error fetching class progress:', error);
      return {
        lessonStats: [],
        quizStats: [],
        error
      };
    }
  },

  /**
   * Fetch detailed student progress for a specific module
   * @param {string} studentId - The student's ID
   * @param {string} moduleId - The module ID
   * @returns {Promise<Object>} Detailed progress with individual lesson and quiz status
   */
  async fetchStudentModuleProgress(studentId, moduleId) {
    try {
      // Get all lessons in this module
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          description,
          duration_minutes,
          sort_order,
          quiz_id
        `)
        .eq('module_id', moduleId)
        .eq('is_active', true)
        .order('sort_order');

      // Get lesson completions for this student
      const { data: completions, error: completionsError } = await supabase
        .from('lesson_completions')
        .select('lesson_id, completed_at')
        .eq('student_id', studentId);

      // Get all quizzes in this module
      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select(`
          id,
          title,
          description,
          total_questions,
          passing_score,
          max_attempts
        `)
        .eq('module_id', moduleId)
        .eq('is_active', true);

      // Get quiz attempts for this student
      const { data: quizAttempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select(`
          quiz_id,
          attempt_number,
          score,
          correct_answers,
          total_questions,
          completed_at
        `)
        .eq('student_id', studentId)
        .order('completed_at', { ascending: false });

      // Process lessons with completion status
      const completionMap = {};
      if (completions) {
        completions.forEach(comp => {
          completionMap[comp.lesson_id] = comp.completed_at;
        });
      }

      const lessonsWithProgress = (lessons || []).map(lesson => ({
        ...lesson,
        isCompleted: !!completionMap[lesson.id],
        completedAt: completionMap[lesson.id] || null
      }));

      // Process quizzes with attempt history
      const attemptsMap = {};
      if (quizAttempts) {
        quizAttempts.forEach(attempt => {
          if (!attemptsMap[attempt.quiz_id]) {
            attemptsMap[attempt.quiz_id] = [];
          }
          attemptsMap[attempt.quiz_id].push(attempt);
        });
      }

      const quizzesWithProgress = (quizzes || []).map(quiz => {
        const attempts = attemptsMap[quiz.id] || [];
        const bestScore = attempts.length > 0 ? Math.max(...attempts.map(a => a.score)) : null;
        const totalAttempts = attempts.length;
        const lastAttempt = attempts[0] || null;

        return {
          ...quiz,
          attempts: totalAttempts,
          bestScore,
          lastAttempt,
          isPassed: bestScore && bestScore >= quiz.passing_score,
          allAttempts: attempts
        };
      });

      return {
        lessons: lessonsWithProgress,
        quizzes: quizzesWithProgress,
        error: lessonsError || completionsError || quizzesError || attemptsError
      };

    } catch (error) {
      console.error('Error fetching student module progress:', error);
      return {
        lessons: [],
        quizzes: [],
        error
      };
    }
  },

  /**
   * Get progress summary for multiple students in a specific module
   * @param {Array} studentIds - Array of student IDs
   * @param {string} moduleId - The module ID
   * @returns {Promise<Object>} Progress summary for each student
   */
  async fetchMultipleStudentsModuleProgress(studentIds, moduleId) {
    try {
      const studentProgressPromises = studentIds.map(studentId => 
        this.fetchStudentModuleProgress(studentId, moduleId)
      );

      const results = await Promise.all(studentProgressPromises);
      
      const studentProgressMap = {};
      studentIds.forEach((studentId, index) => {
        studentProgressMap[studentId] = results[index];
      });

      return {
        studentProgress: studentProgressMap,
        error: null
      };

    } catch (error) {
      console.error('Error fetching multiple students progress:', error);
      return {
        studentProgress: {},
        error
      };
    }
  }
};

export default progressUtils;