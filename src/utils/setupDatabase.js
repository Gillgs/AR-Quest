// Database setup utility to check and create necessary tables
import { supabase } from '../config/supabase.js';

export const checkDatabaseTables = async () => {
  console.log('Checking database tables...');
  
  try {
    // Check if subjects table exists
    const { data: subjectsTest, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .limit(1);
    
    if (subjectsError) {
      console.warn('Subjects table not accessible:', subjectsError.message);
      console.log('This might mean the subjects table doesn\'t exist or has permission issues.');
    } else {
      console.log('✓ Subjects table is accessible');
    }

    // Check if modules table exists
    const { data: modulesTest, error: modulesError } = await supabase
      .from('modules')
      .select('*')
      .limit(1);
    
    if (modulesError) {
      console.warn('Modules table not accessible:', modulesError.message);
      console.log('This might mean the modules table doesn\'t exist or has permission issues.');
    } else {
      console.log('✓ Modules table is accessible');
    }

    // Check if students table exists (we know this works from StatisticsPage)
    const { data: studentsTest, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .limit(1);
    
    if (studentsError) {
      console.warn('Students table not accessible:', studentsError.message);
    } else {
      console.log('✓ Students table is accessible');
    }

    return {
      subjects: !subjectsError,
      modules: !modulesError, 
      students: !studentsError
    };

  } catch (error) {
    console.error('Error checking database:', error);
    return { subjects: false, modules: false, students: false };
  }
};

export const createSampleData = async () => {
  console.log('Creating sample data...');
  
  try {
    // Create sample subjects if the table exists
    const { error: subjectError } = await supabase
      .from('subjects')
      .upsert([
        { id: 'math', name: 'Mathematics', description: 'Mathematical concepts and problem solving' },
        { id: 'lang', name: 'Language', description: 'Language arts and communication skills' },
        { id: 'gmrc', name: 'GMRC', description: 'Good Manners and Right Conduct' },
        { id: 'science', name: 'Science', description: 'Scientific exploration and discovery' },
        { id: 'stats', name: 'Statistics & Probability', description: 'Data analysis and probability theory' }
      ], { onConflict: 'id' });

    if (!subjectError) {
      console.log('✓ Sample subjects created/updated');
    }

    // Create sample modules if the table exists
    const sampleModules = [
      {
        id: '1',
        name: 'Algebra Fundamentals',
        subject_id: 'math',
        subject_name: 'Mathematics',
        description: 'Learn the basic concepts of algebra',
        difficulty_level: 1,
        estimated_duration_minutes: 60,
        sort_order: 0,
        is_active: true
      },
      {
        id: '2', 
        name: 'Grammar Basics',
        subject_id: 'lang',
        subject_name: 'Language',
        description: 'Foundation of proper grammar usage',
        difficulty_level: 1,
        estimated_duration_minutes: 45,
        sort_order: 0,
        is_active: true
      }
    ];

    const { error: moduleError } = await supabase
      .from('modules')
      .upsert(sampleModules, { onConflict: 'id' });

    if (!moduleError) {
      console.log('✓ Sample modules created/updated');
    }

    return true;
  } catch (error) {
    console.error('Error creating sample data:', error);
    return false;
  }
};

// Function to get database schema information
export const getDatabaseSchema = async () => {
  try {
    // This won't work without proper permissions, but we can try
    const { data, error } = await supabase.rpc('get_schema_info');
    
    if (error) {
      console.log('Cannot access schema info directly');
      return null;
    }
    
    return data;
  } catch (error) {
    console.log('Schema inspection not available');
    return null;
  }
};