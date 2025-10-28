// Lesson management utility functions
import { supabase } from '../config/supabase.js';

export const lessonUtils = {
  // Fetch all lessons for a specific module
  fetchLessonsByModule: async (moduleId) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          description,
          quiz_id,
          lesson_data,
          created_at,
          updated_at,
          module_id,
          is_active,
          sort_order,
          content
        `)
        .eq('module_id', moduleId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching lessons for module:', moduleId, error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Unexpected error fetching lessons:', err);
      return [];
    }
  },

  // Fetch lessons for multiple modules at once
  fetchLessonsForModules: async (moduleIds) => {
    if (!moduleIds || moduleIds.length === 0) return {};

    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          description,
          quiz_id,
          lesson_data,
          created_at,
          updated_at,
          module_id,
          is_active,
          sort_order,
          content
        `)
        .in('module_id', moduleIds)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching lessons for modules:', moduleIds, error);
        return {};
      }

      // Group lessons by module_id
      const lessonsByModule = {};
      data?.forEach(lesson => {
        if (!lessonsByModule[lesson.module_id]) {
          lessonsByModule[lesson.module_id] = [];
        }
        lessonsByModule[lesson.module_id].push(lesson);
      });

      return lessonsByModule;
    } catch (err) {
      console.error('Unexpected error fetching lessons for modules:', err);
      return {};
    }
  },

  // Create a new lesson
  createLesson: async (lessonData) => {
    try {
      const newLesson = {
        id: `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: lessonData.title || 'New Lesson',
        description: lessonData.description || '',
        content: lessonData.content || '',
        module_id: lessonData.moduleId,
        quiz_id: lessonData.quizId || null,
        lesson_data: lessonData.lessonData || {},
        sort_order: lessonData.sortOrder || 0,
        is_active: true
      };

      const { data, error } = await supabase
        .from('lessons')
        .insert([newLesson])
        .select()
        .single();

      if (error) {
        console.error('Error creating lesson:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error creating lesson:', err);
      throw err;
    }
  },

  // Update an existing lesson
  updateLesson: async (lessonId, updates) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', lessonId)
        .select()
        .single();

      if (error) {
        console.error('Error updating lesson:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error updating lesson:', err);
      throw err;
    }
  },

  // Delete a lesson (hard delete - completely remove from database)
  deleteLesson: async (lessonId) => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId)
        .select()
        .single();

      if (error) {
        console.error('Error deleting lesson:', error);
        throw error;
      }

      return data;
    } catch (err) {
      console.error('Unexpected error deleting lesson:', err);
      throw err;
    }
  },

  // Create sample lessons for testing/fallback
  createSampleLessons: (moduleId, moduleName) => {
    const sampleLessons = [
      {
        id: `${moduleId}_lesson_1`,
        title: `Introduction to ${moduleName}`,
        description: `Basic concepts and overview of ${moduleName}`,
        content: `Welcome to the ${moduleName} module. In this lesson, you'll learn the fundamental concepts.`,
        module_id: moduleId,
        quiz_id: null,
        lesson_data: { difficulty: 'beginner' },
        sort_order: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: `${moduleId}_lesson_2`,
        title: `${moduleName} Practice`,
        description: `Hands-on practice with ${moduleName} concepts`,
        content: `Now let's practice what we've learned about ${moduleName} with some examples.`,
        module_id: moduleId,
        quiz_id: null,
        lesson_data: { difficulty: 'intermediate' },
        sort_order: 1,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return sampleLessons;
  }
};

export default lessonUtils;
