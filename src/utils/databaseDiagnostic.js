// Quick database diagnostic and setup script
// Run this to check what's in your database and set up sample data

import { supabase } from '../config/supabase.js';

const runDatabaseDiagnostic = async () => {
  console.log('=== DATABASE DIAGNOSTIC ===');
  
  // Check subjects table
  try {
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('*');
    
    if (subjectsError) {
      console.log('❌ Subjects table error:', subjectsError.message);
    } else {
      console.log('✅ Subjects table found with', subjects.length, 'records:');
      subjects.forEach(subject => {
        console.log(`  - ID: ${subject.id}, Name: ${subject.name}`);
      });
    }
  } catch (err) {
    console.log('❌ Cannot access subjects table:', err.message);
  }

  // Check modules table
  try {
    const { data: modules, error: modulesError } = await supabase
      .from('modules')
      .select('id, name, subject_id')
      .limit(10);
    
    if (modulesError) {
      console.log('❌ Modules table error:', modulesError.message);
    } else {
      console.log('✅ Modules table found with', modules.length, 'records (showing first 10):');
      modules.forEach(module => {
        console.log(`  - ID: ${module.id}, Name: ${module.name}, Subject ID: ${module.subject_id}`);
      });
    }
  } catch (err) {
    console.log('❌ Cannot access modules table:', err.message);
  }
};

const createSubjectsIfNeeded = async () => {
  console.log('\n=== CREATING SAMPLE SUBJECTS ===');
  
  const sampleSubjects = [
    { id: 'math', name: 'Mathematics' },
    { id: 'language', name: 'Language' },
    { id: 'gmrc', name: 'GMRC' },
    { id: 'environment', name: 'Physical & Natural Environment' },
    { id: 'makabayan', name: 'Makabansa' }
  ];

  try {
    const { data, error } = await supabase
      .from('subjects')
      .upsert(sampleSubjects, { onConflict: 'id' })
      .select();

    if (error) {
      console.log('❌ Could not create subjects:', error.message);
    } else {
      console.log('✅ Created/updated', data.length, 'subjects');
      data.forEach(subject => {
        console.log(`  - ${subject.name} (ID: ${subject.id})`);
      });
    }
  } catch (err) {
    console.log('❌ Error creating subjects:', err.message);
  }
};

// Export functions for use in the app
export { runDatabaseDiagnostic, createSubjectsIfNeeded };

// Auto-run if this file is executed directly
if (typeof window !== 'undefined') {
  console.log('Database diagnostic tools loaded. Use runDatabaseDiagnostic() and createSubjectsIfNeeded()');
}