import React, { useState, useEffect } from 'react';
import { supabase } from '../config/supabase';
import { progressUtils } from '../utils/progressUtils';
import { ChevronRight, Clock, Award, CheckCircle, XCircle, Play, Users } from 'lucide-react';

const ProgressDetails = ({ 
  moduleId, 
  studentId, 
  userRole, 
  showForAllStudents = false,
  students = [],
  colors,
  spacing,
  borderRadius,
  shadows 
}) => {
  const [lessonsProgress, setLessonsProgress] = useState([]);
  const [quizzesProgress, setQuizzesProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentForTeacher, setSelectedStudentForTeacher] = useState(null);

  useEffect(() => {
    if (moduleId) {
      fetchProgressDetails();
    }
  }, [moduleId, studentId, showForAllStudents]);

  const fetchProgressDetails = async () => {
    setLoading(true);
    try {
      if (showForAllStudents && userRole === 'teacher') {
        // Teacher view: show all students in their section
        await fetchTeacherProgressDetails();
      } else {
        // Parent view: show specific student
        await fetchStudentProgressDetails();
      }
    } catch (error) {
      console.error('Error fetching progress details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProgressDetails = async () => {
    try {
      const progressData = await progressUtils.fetchStudentModuleProgress(studentId, moduleId);
      
      if (progressData.error) {
        console.error('Error fetching student progress:', progressData.error);
      }

      setLessonsProgress(progressData.lessons || []);
      setQuizzesProgress(progressData.quizzes || []);
    } catch (error) {
      console.error('Error in fetchStudentProgressDetails:', error);
      setLessonsProgress([]);
      setQuizzesProgress([]);
    }
  };

  const fetchTeacherProgressDetails = async () => {
    try {
      const studentIds = students.map(s => s.id);
      const classData = await progressUtils.fetchClassProgress(studentIds, moduleId);
      
      if (classData.error) {
        console.error('Error fetching class progress:', classData.error);
      }

      setLessonsProgress(classData.lessonStats || []);
      setQuizzesProgress(classData.quizStats || []);
    } catch (error) {
      console.error('Error in fetchTeacherProgressDetails:', error);
      setLessonsProgress([]);
      setQuizzesProgress([]);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score, passingScore = 70) => {
    if (score >= 90) return '#10b981'; // green
    if (score >= passingScore) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  if (loading) {
    return (
      <div style={{ 
        padding: spacing.md, 
        textAlign: 'center',
        color: colors.mutedText 
      }}>
        Loading progress details...
      </div>
    );
  }

  if (userRole === 'teacher' && showForAllStudents) {
    return (
      <div style={{ 
        padding: spacing.md,
        background: '#f8f9fa',
        borderRadius: borderRadius.md,
        marginTop: spacing.sm 
      }}>
        {/* Teacher view - Class overview */}
        <div style={{ marginBottom: spacing.lg }}>
          <h4 style={{ 
            margin: 0, 
            marginBottom: spacing.md,
            color: colors.textColor,
            fontSize: '1rem',
            fontWeight: 600 
          }}>
            Class Progress Overview
          </h4>

          {/* Lessons Overview */}
          {lessonsProgress.length > 0 && (
            <div style={{ marginBottom: spacing.lg }}>
              <h5 style={{ 
                margin: 0, 
                marginBottom: spacing.sm,
                color: colors.textColor,
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs
              }}>
                <CheckCircle size={16} />
                Lessons ({lessonsProgress.length})
              </h5>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {lessonsProgress.map(lesson => (
                  <div 
                    key={lesson.id}
                    style={{
                      padding: spacing.sm,
                      background: '#ffffff',
                      borderRadius: borderRadius.sm,
                      border: `1px solid ${colors.borderColor}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontWeight: 600, 
                        color: colors.textColor,
                        fontSize: '0.85rem',
                        marginBottom: '2px'
                      }}>
                        {lesson.title}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: colors.mutedText 
                      }}>
                        {lesson.completedBy}/{lesson.totalStudents} students completed
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                      <div style={{
                        width: '60px',
                        height: '6px',
                        background: 'rgba(0,0,0,0.1)',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${lesson.completionRate}%`,
                          height: '100%',
                          background: lesson.completionRate >= 80 ? '#10b981' : 
                                     lesson.completionRate >= 60 ? '#f59e0b' : '#ef4444',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 600,
                        color: colors.textColor,
                        minWidth: '35px',
                        textAlign: 'right'
                      }}>
                        {lesson.completionRate}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quizzes Overview */}
          {quizzesProgress.length > 0 && (
            <div>
              <h5 style={{ 
                margin: 0, 
                marginBottom: spacing.sm,
                color: colors.textColor,
                fontSize: '0.9rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs
              }}>
                <Award size={16} />
                Quizzes ({quizzesProgress.length})
              </h5>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                {quizzesProgress.map(quiz => (
                  <div 
                    key={quiz.id}
                    style={{
                      padding: spacing.sm,
                      background: '#ffffff',
                      borderRadius: borderRadius.sm,
                      border: `1px solid ${colors.borderColor}`
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: spacing.xs
                    }}>
                      <div style={{ 
                        fontWeight: 600, 
                        color: colors.textColor,
                        fontSize: '0.85rem'
                      }}>
                        {quiz.title}
                      </div>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 600,
                        color: getScoreColor(quiz.averageScore, quiz.passing_score)
                      }}>
                        Avg: {quiz.averageScore}%
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: colors.mutedText
                    }}>
                      <span>{quiz.attemptedCount}/{quiz.totalStudents} attempted</span>
                      <span>{quiz.passedCount} passed</span>
                      <span>{Math.round(quiz.passRate)}% pass rate</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Individual Student Selection */}
          <div style={{ 
            marginTop: spacing.lg,
            padding: spacing.md,
            background: '#ffffff',
            borderRadius: borderRadius.md,
            border: `1px solid ${colors.borderColor}`
          }}>
            <h5 style={{ 
              margin: 0, 
              marginBottom: spacing.sm,
              color: colors.textColor,
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs
            }}>
              <Users size={16} />
              Individual Student Details
            </h5>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.xs }}>
              {students.map(student => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentForTeacher(
                    selectedStudentForTeacher?.id === student.id ? null : student
                  )}
                  style={{
                    padding: spacing.sm,
                    background: selectedStudentForTeacher?.id === student.id ? '#f0f9ff' : '#ffffff',
                    border: `1px solid ${colors.borderColor}`,
                    borderRadius: borderRadius.sm,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.85rem'
                  }}
                >
                  <span style={{ fontWeight: 500, color: colors.textColor }}>
                    {student.name}
                  </span>
                  <ChevronRight 
                    size={14} 
                    style={{ 
                      transform: selectedStudentForTeacher?.id === student.id ? 'rotate(90deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Individual Student Progress */}
          {selectedStudentForTeacher && (
            <div style={{ marginTop: spacing.md }}>
              <ProgressDetails
                moduleId={moduleId}
                studentId={selectedStudentForTeacher.id}
                userRole="parent" // Use parent view for individual student details
                showForAllStudents={false}
                colors={colors}
                spacing={spacing}
                borderRadius={borderRadius}
                shadows={shadows}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Parent/Individual student view
  return (
    <div style={{ 
      padding: spacing.md,
      background: '#f8f9fa',
      borderRadius: borderRadius.md,
      marginTop: spacing.sm 
    }}>
      {/* Lessons Progress */}
      {lessonsProgress.length > 0 && (
        <div style={{ marginBottom: spacing.lg }}>
          <h4 style={{ 
            margin: 0, 
            marginBottom: spacing.md,
            color: colors.textColor,
            fontSize: '0.95rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs
          }}>
            <CheckCircle size={16} />
            Lessons ({lessonsProgress.filter(l => l.isCompleted).length}/{lessonsProgress.length})
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {lessonsProgress.map(lesson => (
              <div 
                key={lesson.id}
                style={{
                  padding: spacing.sm,
                  background: lesson.isCompleted ? '#f0fdf4' : '#ffffff',
                  borderRadius: borderRadius.sm,
                  border: `1px solid ${lesson.isCompleted ? '#16a34a' : colors.borderColor}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  {lesson.isCompleted ? (
                    <CheckCircle size={18} color="#16a34a" />
                  ) : (
                    <Play size={18} color={colors.mutedText} />
                  )}
                  <div>
                    <div style={{ 
                      fontWeight: 600, 
                      color: colors.textColor,
                      fontSize: '0.85rem'
                    }}>
                      {lesson.title}
                    </div>
                    {lesson.duration_minutes && (
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: colors.mutedText,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <Clock size={12} />
                        {lesson.duration_minutes} min
                      </div>
                    )}
                  </div>
                </div>
                
                {lesson.isCompleted && lesson.completedAt && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: colors.mutedText,
                    textAlign: 'right'
                  }}>
                    Completed<br />
                    {formatDate(lesson.completedAt)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quizzes Progress */}
      {quizzesProgress.length > 0 && (
        <div>
          <h4 style={{ 
            margin: 0, 
            marginBottom: spacing.md,
            color: colors.textColor,
            fontSize: '0.95rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.xs
          }}>
            <Award size={16} />
            Quizzes ({quizzesProgress.filter(q => q.attempts > 0).length}/{quizzesProgress.length})
          </h4>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {quizzesProgress.map(quiz => (
              <div 
                key={quiz.id}
                style={{
                  padding: spacing.sm,
                  background: quiz.isPassed ? '#f0fdf4' : 
                            quiz.attempts > 0 ? '#fef3c7' : '#ffffff',
                  borderRadius: borderRadius.sm,
                  border: `1px solid ${quiz.isPassed ? '#16a34a' : 
                                      quiz.attempts > 0 ? '#f59e0b' : colors.borderColor}`
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: quiz.attempts > 0 ? spacing.xs : 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                    {quiz.isPassed ? (
                      <CheckCircle size={18} color="#16a34a" />
                    ) : quiz.attempts > 0 ? (
                      <XCircle size={18} color="#f59e0b" />
                    ) : (
                      <Award size={18} color={colors.mutedText} />
                    )}
                    <div>
                      <div style={{ 
                        fontWeight: 600, 
                        color: colors.textColor,
                        fontSize: '0.85rem'
                      }}>
                        {quiz.title}
                      </div>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: colors.mutedText 
                      }}>
                        {quiz.total_questions} questions • Pass: {quiz.passing_score}%
                      </div>
                    </div>
                  </div>
                  
                  {quiz.bestScore !== null && (
                    <div style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end'
                    }}>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 600,
                        color: getScoreColor(quiz.bestScore, quiz.passing_score)
                      }}>
                        {quiz.allAttempts?.[0]?.correct_answers || 0}/{quiz.allAttempts?.[0]?.total_questions || 0}
                      </div>
                      <div style={{ 
                        fontSize: '0.7rem',
                        color: colors.mutedText
                      }}>
                        Highest: {quiz.bestScore}%
                      </div>
                    </div>
                  )}
                </div>
                
                {quiz.attempts > 0 && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: colors.mutedText,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>Attempts: {quiz.attempts}</span>
                    {quiz.lastAttempt && quiz.lastAttempt.completed_at && (
                      <span>Last: {formatDate(quiz.lastAttempt.completed_at)}</span>
                    )}
                  </div>
                )}
                
                {quiz.attempts === 0 && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: colors.mutedText,
                    marginTop: spacing.xs
                  }}>
                    Not attempted yet
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {lessonsProgress.length === 0 && quizzesProgress.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          color: colors.mutedText,
          padding: spacing.lg,
          fontSize: '0.9rem'
        }}>
          No lessons or quizzes found for this module.
        </div>
      )}
    </div>
  );
};

export default ProgressDetails;