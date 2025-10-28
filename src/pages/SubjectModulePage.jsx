import React, { useState, useEffect, useRef, useContext } from 'react';
import SideMenu from '../components/SideMenu';
import { supabase, supabaseAdmin } from '../config/supabase';
import { SelectedChildContext } from '../contexts/SelectedChildContext';
import { checkDatabaseTables } from '../utils/setupDatabase';
import { runDatabaseDiagnostic, createSubjectsIfNeeded } from '../utils/databaseDiagnostic';
import { lessonUtils } from '../utils/lessonUtils';
import { quizUtils } from '../utils/quizUtils';
import { moduleUtils } from '../utils/moduleUtils';
import CreateModuleModal from '../components/CreateModuleModal';
import ProgressDetails from '../components/ProgressDetails';
import languageImg from '../Subject_image/Language.png';
import gmrcImg from '../Subject_image/GMRC.png';
import mathImg from '../Subject_image/Mathemathics.png';
import makabansaImg from '../Subject_image/Makabansa.png';
import environmentImg from '../Subject_image/Physical & Natural Environment.png';

import { ChevronDown, ChevronRight, FileText, Calendar, Link, Plus, ArrowLeft, BookOpen, Award, TrendingUp, Users, X, Edit3, Trash2, Clock, Check } from 'lucide-react';
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Container, ListGroup, Image, Button, Toast, ToastContainer } from "react-bootstrap";
import { FiGrid, FiUser, FiLogOut, FiBook, FiBarChart2, FiTrendingUp, FiMenu, FiX } from "react-icons/fi";

// Subject images mapping
const subjectImages = {
  Mathematics: mathImg,
  Language: languageImg,
  GMRC: gmrcImg,
  Makabansa: makabansaImg,
  'Physical & Natural Environment': environmentImg
};




const CreateQuizModal = ({
  showQuizModal,
  setShowQuizModal,
  newQuizTitle,
  setNewQuizTitle,
  newQuizDescription,
  setNewQuizDescription,
  newQuizQuestionCount,
  setNewQuizQuestionCount,
  newQuizPassingScore,
  setNewQuizPassingScore,
  quizQuestions,
  setQuizQuestions,
  handleSubmitQuiz,
  resetQuizForm,
  addQuestion,
  removeQuestion,
  updateQuestion,
  updateQuestionOption,
  setCorrectAnswer,
  handleQuestionImageUpload,
  removeQuestionImage,
  moduleColor = '#6366f1',
  lessons = [],
  selectedLessonId,
  setSelectedLessonId
}) => {
  const [isClosing, setIsClosing] = useState(false);
    // lock body scroll while this modal is open
    useEffect(() => {
      if (!showQuizModal) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }, [showQuizModal]);
  const quizLocalBorderRadiusLg = '12px';
  const quizLocalShadowsLg = '0 25px 50px -12px rgba(0, 0, 0, 0.25)';
  // local layout tokens (file-level tokens are declared later in this file, so keep locals here)
  const localBorderRadiusLg = '16px';
  const localBorderRadiusSm = '6px';
  const localShadowsLg = '0 10px 15px rgba(0,0,0,0.1)';
  // Local refs to manage scrolling/focus for newly added questions
  const localQuestionsContainerRef = useRef(null);
  const localQuestionRefs = useRef({});
  const prevQuestionsLenRef = useRef(quizQuestions.length);
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowQuizModal(false);
      setIsClosing(false);
      resetQuizForm();
    }, 200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass the currently selected lesson id so the created quiz can be bound to it
    handleSubmitQuiz(selectedLessonId);
  };

  // When a question is appended, scroll it into view and focus its textarea
  useEffect(() => {
    if (quizQuestions.length > prevQuestionsLenRef.current) {
      const newQuestion = quizQuestions[quizQuestions.length - 1];
      const container = localQuestionsContainerRef.current;

      // Wait for the new question DOM node to mount, using requestAnimationFrame loop
      const attemptScroll = () => {
        const el = localQuestionRefs.current[newQuestion.id];
        if (el && container) {
          // Use bounding rects to compute how much to scroll so the element is visible
          const elRect = el.getBoundingClientRect();
          const contRect = container.getBoundingClientRect();
          const padding = 12;
          let delta = 0;

          if (elRect.top < contRect.top + padding) {
            delta = elRect.top - (contRect.top + padding);
          } else if (elRect.bottom > contRect.bottom - padding) {
            delta = elRect.bottom - (contRect.bottom - padding);
          }

          if (delta !== 0) {
            // Smoothly scroll the container by delta (positive or negative)
            container.scrollBy({ top: delta, behavior: 'smooth' });
            // Focus after a short delay so the browser doesn't try to auto-scroll due to focus
            setTimeout(() => {
              const ta = el.querySelector && el.querySelector('textarea');
              if (ta) ta.focus();
            }, 220);
          } else {
            // Already visible — focus immediately
            const ta = el.querySelector && el.querySelector('textarea');
            if (ta) ta.focus();
          }
        } else {
          // Try again next frame until the element exists (avoid infinite loop by checking length)
          if (quizQuestions.length >= prevQuestionsLenRef.current) {
            window.requestAnimationFrame(attemptScroll);
          }
        }
      };

      window.requestAnimationFrame(attemptScroll);
    }

    prevQuestionsLenRef.current = quizQuestions.length;
  }, [quizQuestions]);

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        background: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}
  // clicking the backdrop no longer closes the modal; require explicit close
    >
      <form 
        onSubmit={handleSubmit}
        style={{ 
          background: '#ffffff', 
          borderRadius: quizLocalBorderRadiusLg,
          width: '95%',
          maxWidth: '1000px',
          height: '75vh',
          maxHeight: '75vh',
          overflow: 'hidden',
          boxShadow: quizLocalShadowsLg,
          transform: isClosing ? 'scale(0.98)' : 'scale(1)',
          transition: 'transform 0.15s ease-out',
          display: 'flex',
          flexDirection: 'column',
          border: `2px solid ${moduleColor}`
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '24px 32px',
          borderBottom: '1px solid #e2e8f0',
          background: 'white'
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 600, 
            color: '#000', 
            margin: 0 
          }}>
            Create New Quiz
          </h1>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              color: '#111',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Modal Content */}
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', padding: '16px 20px', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left: Quiz Settings */}
          <div style={{ overflowY: 'auto', paddingRight: '8px', minHeight: 0 }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>Quiz Settings</h2>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Quiz Title *</label>
              <input type="text" value={newQuizTitle} onChange={e => setNewQuizTitle(e.target.value)} placeholder="Enter quiz title..." style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} required />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Attach to lesson (optional)</label>
              <select value={selectedLessonId || ''} onChange={e => setSelectedLessonId(e.target.value || null)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', outline: 'none' }}>
                <option value="">(No lesson)</option>
                {lessons.map(lesson => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Quiz Description</label>
              <textarea value={newQuizDescription} onChange={e => setNewQuizDescription(e.target.value)} placeholder='Enter quiz description (optional)...' style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px', minHeight: '60px', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Number of Questions</label>
                <input type='number' value={newQuizQuestionCount} onChange={e => { const val = e.target.value; if (val === '') setNewQuizQuestionCount(''); else setNewQuizQuestionCount(Math.max(1, Math.min(50, parseInt(val)))); }} min='1' max='50' style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
              </div>
              {/* Time limit removed per request */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>Passing Score (%)</label>
                <input type='number' value={newQuizPassingScore} onChange={e => { const val = e.target.value; if (val === '') setNewQuizPassingScore(''); else setNewQuizPassingScore(Math.max(1, Math.min(100, parseInt(val)))); }} min='1' max='100' style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '13px' }} />
              </div>
            </div>
          </div>

          {/* Right: Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', margin: 0 }}>Quiz Questions</h2>
              <div style={{ background: moduleColor || '#6366f1', color: 'white', padding: '4px 10px', borderRadius: '16px', fontSize: '13px', fontWeight: 600 }}>{quizQuestions.length}</div>
            </div>

            <button type='button' onClick={addQuestion} style={{ background: moduleColor || '#6366f1', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '12px', flexShrink: 0 }}>+ Add Question</button>

            <div ref={localQuestionsContainerRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '2px', scrollbarWidth: 'thin' }}>
              {quizQuestions.map((question, qIndex) => (
                <div key={question.id} ref={el => { if (el) localQuestionRefs.current[question.id] = el; }} style={{ background: 'white', borderRadius: '10px', padding: '14px', marginBottom: '12px', border: '1px solid #e2e8f0', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Question {qIndex + 1}</span>
                    {quizQuestions.length > 1 && <button type='button' onClick={() => removeQuestion(question.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', borderRadius: '4px', fontSize: '13px' }}>Delete</button>}
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Question Text *</label>
                    <textarea value={question.question} onChange={(e) => updateQuestion(question.id, 'question', e.target.value)} placeholder='Enter your question here...' style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#ffffff', color: '#333333', fontSize: '13px', outline: 'none', boxSizing: 'border-box', minHeight: '60px', resize: 'vertical' }} />
                  </div>

                  {/* Question Image Upload Section */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Question Image (Optional)</label>
                    
                    {question.image_url ? (
                      <div style={{ marginBottom: '8px' }}>
                        <img 
                          src={question.image_url} 
                          alt="Question preview" 
                          style={{ 
                            maxWidth: '200px', 
                            maxHeight: '150px', 
                            width: 'auto', 
                            height: 'auto', 
                            borderRadius: '6px', 
                            border: '1px solid #e2e8f0',
                            display: 'block',
                            marginBottom: '8px'
                          }} 
                        />
                        <button 
                          type="button" 
                          onClick={() => removeQuestionImage(question.id)}
                          style={{ 
                            background: '#ef4444', 
                            color: 'white', 
                            border: 'none', 
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '12px', 
                            cursor: 'pointer' 
                          }}
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input 
                          type="file" 
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              // Reset the input value so the same file can be selected again if needed
                              e.target.value = '';
                              handleQuestionImageUpload(question.id, file);
                            }
                          }}
                          style={{ 
                            width: '100%', 
                            padding: '8px 12px', 
                            border: '1px solid #d1d5db', 
                            borderRadius: '6px', 
                            fontSize: '13px',
                            cursor: 'pointer',
                            backgroundColor: '#f8fafc'
                          }}
                        />
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                          Supported: JPG, PNG, GIF, WebP. Max: 5MB. If upload fails, image will be stored locally.
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>Answer Options *</label>
                    {question.options.map((option, optIndex) => (
                      <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <input type='radio' name={`correct-${question.id}`} checked={question.correctAnswer === optIndex} onChange={() => setCorrectAnswer(question.id, optIndex)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                        <div style={{ background: question.correctAnswer === optIndex ? '#10b98120' : '#f8fafc', border: `2px solid ${question.correctAnswer === optIndex ? '#10b981' : '#e2e8f0'}`, borderRadius: '6px', padding: '4px 8px', minWidth: '24px', textAlign: 'center', fontWeight: 600, color: question.correctAnswer === optIndex ? '#10b981' : '#64748b', fontSize: '13px' }}>{String.fromCharCode(65 + optIndex)}</div>
                        <input type='text' value={option} onChange={(e) => updateQuestionOption(question.id, optIndex, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + optIndex)}`} style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: `2px solid ${question.correctAnswer === optIndex ? '#10b981' : '#e2e8f0'}`, background: question.correctAnswer === optIndex ? '#10b98110' : '#ffffff', color: '#333333', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    ))}
                    <p style={{ fontSize: '12px', color: '#64748b', margin: 0, marginTop: '8px', fontStyle: 'italic' }}>Select the radio button next to the correct answer</p>
                  </div>
                </div>
              ))}
            </div>
      </div>
    </div>

    {/* Modal Footer */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px', 
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          flexShrink: 0
        }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: '#fff',
              color: '#475569',
              border: '1px solid #e6eef6',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              minWidth: '80px'
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#fbfdff'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!newQuizTitle.trim()}
            style={{
              background: moduleColor || '#6366f1',
              color: 'white',
              border: `2px solid ${moduleColor || '#6366f1'}`,
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              minWidth: '120px',
              boxShadow: `0 2px 8px 0 ${moduleColor ? moduleColor + '66' : 'rgba(99, 102, 241, 0.4)'}`,
              opacity: !newQuizTitle.trim() ? 0.6 : 1
            }}
          >
            Create Quiz
          </button>
        </div>
      </form>
    </div>
  );
};

const CreateLessonModal = ({ 
  showLessonModal, 
  setShowLessonModal, 
  newLessonTitle, 
  setNewLessonTitle, 
  newLessonDescription, 
  setNewLessonDescription,
  newLessonContent,
  setNewLessonContent,
  handleSubmitLesson,
  resetLessonForm,
  moduleColor = '#6366f1'
}) => {
  const [isClosing, setIsClosing] = useState(false);
  // lock body scroll while this create-lesson modal is open
  useEffect(() => {
    if (!showLessonModal) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [showLessonModal]);
  // local layout tokens (ensure defined before use)
  const localBorderRadiusLg = '16px';
  const localBorderRadiusSm = '6px';
  const localShadowsLg = '0 10px 15px rgba(0,0,0,0.1)';
  // local helpers in case file-level helpers are defined later
  const localDarken = (hex, percent) => {
    try {
      const num = parseInt(hex.replace('#',''),16);
      const r = (num >> 16) & 0xFF;
      const g = (num >> 8) & 0xFF;
      const b = num & 0xFF;

      const amt = Math.round(2.55 * percent);
      const R = Math.max(0, Math.min(255, r - amt));
      const G = Math.max(0, Math.min(255, g - amt));
      const B = Math.max(0, Math.min(255, b - amt));

      return `#${(R<<16 | G<<8 | B).toString(16).padStart(6,'0')}`;
    } catch (e) {
      return hex;
    }
  };

  const localHexToRgba = (hex, alpha = 1) => {
    try {
      const clean = hex.replace('#', '');
      const num = parseInt(clean, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) {
      return hex;
    }
  };
  
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowLessonModal(false);
      setIsClosing(false);
      resetLessonForm();
    }, 200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSubmitLesson();
  };

  const hoverColor = localDarken(moduleColor, 8);

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        background: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}
  // clicking the backdrop no longer closes the modal; require explicit close
    >
      <form 
        onSubmit={handleSubmit}
        style={{ 
          background: '#ffffff', 
          padding: '32px', 
          borderRadius: localBorderRadiusLg, 
          boxShadow: localShadowsLg, 
          minWidth: 520,
          maxWidth: 680,
          width: '88%',
          maxHeight: '90vh',
          overflowY: 'auto',
          transform: isClosing ? 'scale(0.97)' : 'scale(1)',
          transition: 'transform 0.18s ease-out, box-shadow 0.18s ease-out',
          border: `2px solid ${moduleColor}`,
          position: 'relative',
          paddingLeft: '32px'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* left accent stripe removed per request */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px'
        }}>
          <h2 style={{ fontWeight: 700, fontSize: '1.5rem', color: '#000', margin: 0 }}>
            Create New Lesson
          </h2>
          <button
            type="button"
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              color: '#64748b',
              fontSize: '24px'
            }}
          >
            ×
          </button>
        </div>

        {/* Lesson Title */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '4px', 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            color: '#1e293b' 
          }}>
            Lesson Title *
          </label>
          <input
            type="text"
            value={newLessonTitle}
            onChange={e => setNewLessonTitle(e.target.value)}
            placeholder="Enter lesson title..."
            style={{ 
              width: '100%',
              padding: '12px 16px', 
              borderRadius: '8px', 
              border: '1px solid #d1d5db', 
              fontSize: '14px', 
              outline: 'none', 
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              background: '#ffffff',
              color: '#333333'
            }}
            required
          />
        </div>

        {/* Lesson Description */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '4px', 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            color: '#1e293b' 
          }}>
            Lesson Description
          </label>
          <textarea
            value={newLessonDescription}
            onChange={e => setNewLessonDescription(e.target.value)}
            placeholder="Enter lesson description (optional)..."
            rows={3}
            style={{ 
              width: '100%',
              padding: '12px 16px', 
              borderRadius: '8px', 
              border: '1px solid #d1d5db', 
              fontSize: '14px', 
              outline: 'none', 
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              resize: 'vertical',
              minHeight: '80px',
              background: '#ffffff',
              color: '#333333'
            }}
          />
        </div>

        {/* Lesson Content */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '4px', 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            color: '#1e293b' 
          }}>
            Lesson Content *
          </label>
          <textarea
            value={newLessonContent}
            onChange={e => setNewLessonContent(e.target.value)}
            placeholder="Enter the main content of your lesson..."
            rows={6}
            style={{ 
              width: '100%',
              padding: '12px 16px', 
              borderRadius: '8px', 
              border: '1px solid #d1d5db', 
              fontSize: '14px', 
              outline: 'none', 
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              resize: 'vertical',
              minHeight: '160px',
              background: '#ffffff',
              color: '#333333'
            }}
            required
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: 12 }}>
          <button 
            type="button"
            onClick={handleClose}
            style={{ 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: '2px solid #e2e8f0', 
              background: '#ffffff', 
              color: '#1e293b', 
              fontWeight: 600, 
              fontSize: '1rem', 
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={!newLessonTitle.trim()}
            style={{ 
              padding: '12px 24px', 
              borderRadius: '8px', 
              border: `2px solid ${moduleColor}`, 
              background: moduleColor, 
              color: '#fff', 
              fontWeight: 600, 
              fontSize: '1rem', 
              cursor: !newLessonTitle.trim() ? 'not-allowed' : 'pointer',
              opacity: !newLessonTitle.trim() ? 0.6 : 1
            }}
            onMouseEnter={e => { if (e.currentTarget) { e.currentTarget.style.background = hoverColor; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${localHexToRgba(moduleColor,0.18)}`; } }}
            onMouseLeave={e => { if (e.currentTarget) { e.currentTarget.style.background = moduleColor; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; } }}
          >
            Create Lesson
          </button>
        </div>
      </form>
    </div>
  );
};

const getDifficultyCategory = (level) => {
  switch (level) {
    case 1: return '(Beginner)';
    case 2: return '(Intermediate)';
    case 3: return '(Advanced)';
    case 4: return '(Expert)';
    case 5: return '(Master)';
    default: return '(Beginner)';
  }
};

// (dummyStudents is declared once above)

const SubjectModulePage = () => {
  const userRole = localStorage.getItem('userRole');
  const userId = localStorage.getItem('userId');
  const { selectedChildId, selectedChildName } = useContext(SelectedChildContext);
  
  // State for teacher's assigned section and real students
  const [teacherSection, setTeacherSection] = useState(null);
  const [realStudents, setRealStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Function to fetch quiz attempts for a student
  const fetchQuizAttempts = async (studentId) => {
    try {
      
      const { data: attempts, error } = await supabase
        .from('quiz_attempts')
        .select(`
          id,
          quiz_id,
          attempt_number,
          score,
          total_questions,
          correct_answers,
          time_spent_seconds,
          completed_at,
          started_at
        `)
        .eq('student_id', studentId)
        .not('score', 'is', null) // Only attempts with a score (completed or in-progress with score)
        .order('attempt_number', { ascending: false });

      if (error) {
        return {};
      }

      // Group attempts by quiz_id and calculate best scores
      const quizAttemptsMap = {};
      
      if (attempts && attempts.length > 0) {
        
        // First, get quiz information for all the quiz IDs we have attempts for
        const quizIds = [...new Set(attempts.map(a => a.quiz_id))];
        
        // Fetch quiz details
        const { data: quizzes, error: quizzesError } = await supabase
          .from('quizzes')
          .select('id, title, module_id')
          .in('id', quizIds);
          
        
        // Create a map of quiz info
        const quizInfoMap = {};
        if (quizzes) {
          quizzes.forEach(quiz => {
            quizInfoMap[quiz.id] = quiz;
          });
        }
        
        attempts.forEach(attempt => {
          const quizId = attempt.quiz_id;
          const quizInfo = quizInfoMap[quizId];
          
          if (!quizAttemptsMap[quizId]) {
            quizAttemptsMap[quizId] = {
              quiz_id: quizId,
              quiz_title: quizInfo?.title || `Quiz ${quizId}`,
              module_id: quizInfo?.module_id,
              attempts: [],
              best_score: 0,
              total_attempts: 0
            };
          }
          
          quizAttemptsMap[quizId].attempts.push({
            attempt_number: attempt.attempt_number,
            score: attempt.score,
            total_questions: attempt.total_questions,
            correct_answers: attempt.correct_answers,
            completed_at: attempt.completed_at,
            time_spent: attempt.time_spent_seconds
          });
          
          // Update best score and total attempts
          if (attempt.score !== null && attempt.score !== undefined) {
            quizAttemptsMap[quizId].best_score = Math.max(
              quizAttemptsMap[quizId].best_score, 
              attempt.score
            );
          }
          quizAttemptsMap[quizId].total_attempts = quizAttemptsMap[quizId].attempts.length;
        });
        
      } else {
        
        // Also try to fetch all quiz attempts for this student to see what we get
        const { data: allAttempts, error: allError } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('student_id', studentId);
          
        
        // Also check what quiz IDs exist in the database overall
        const { data: allQuizIds, error: quizIdError } = await supabase
          .from('quiz_attempts')
          .select('quiz_id', { count: 'exact' })
          .limit(20);
      }

      return quizAttemptsMap;
    } catch (error) {
      return {};
    }
  };

  // Function to generate progress data for students based on actual modules
  const generateStudentProgress = async (student, availableModules) => {
    // Fetch real quiz attempts for this student
    const quizAttemptsMap = await fetchQuizAttempts(student.id);
    
    const moduleProgress = await Promise.all(availableModules.map(async (module) => {
      const totalLessons = module.lessons ? module.lessons.length : 0;
      const totalQuizzes = module.quizzes ? module.quizzes.length : 0;
      
      // Calculate total items in the module (lessons + quizzes)
      const totalItems = totalLessons + totalQuizzes;
      
      // Fetch completed lessons from lesson_completions table
      let completedLessonsCount = 0;
      let completedLessonIds = [];
      try {
        if (totalLessons > 0) {
          const lessonIds = module.lessons.map(l => l.id);
          const { data: completions, error } = await supabase
            .from('lesson_completions')
            .select('lesson_id, completed_at')
            .eq('student_id', student.id)
            .in('lesson_id', lessonIds);
          
          if (!error && completions) {
            completedLessonsCount = completions.length;
            completedLessonIds = completions.map(c => c.lesson_id);
          }
        }
      } catch (error) {
        console.error('Error fetching lesson completions:', error);
        completedLessonsCount = 0;
        completedLessonIds = [];
      }
      
      // Count completed quizzes (any quiz with a completed attempt)
      let completedQuizzesCount = 0;
      const moduleQuizzes = module.quizzes || [];
      
      if (moduleQuizzes.length > 0) {
        moduleQuizzes.forEach(quiz => {
          const quizAttempts = quizAttemptsMap[quiz.id];
          // If quiz has at least one completed attempt, count it as completed
          if (quizAttempts && quizAttempts.total_attempts > 0) {
            completedQuizzesCount += 1;
          }
        });
      }
      
      // Calculate progress: completed items / total items
      // Example: if 2 lessons completed + 1 quiz completed out of 3 lessons + 2 quizzes = 3/5 = 60%
      const completedItems = completedLessonsCount + completedQuizzesCount;
      const completion = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      
      // Prepare quiz data for display
      let moduleQuizData = null;
      if (moduleQuizzes.length > 0) {
        let bestScore = 0;
        let totalAttempts = 0;
        let hasAttempts = false;
        
        moduleQuizzes.forEach(quiz => {
          const quizAttempts = quizAttemptsMap[quiz.id];
          
          if (quizAttempts && quizAttempts.total_attempts > 0) {
            hasAttempts = true;
            bestScore = Math.max(bestScore, quizAttempts.best_score);
            totalAttempts += quizAttempts.total_attempts;
          }
        });
        
        if (hasAttempts) {
          moduleQuizData = {
            best_score: bestScore,
            attempts: totalAttempts,
            quiz_count: moduleQuizzes.length,
            completed_count: completedQuizzesCount,
            details: moduleQuizzes.map(quiz => {
              const attempts = quizAttemptsMap[quiz.id];
              return {
                quiz_id: quiz.id,
                quiz_title: quiz.title,
                best_score: attempts?.best_score || 0,
                attempts: attempts?.total_attempts || 0,
                last_attempt: attempts?.attempts?.[0]?.completed_at || null
              };
            })
          };
        }
      }

      return {
        id: module.id,
        title: module.name,
        completion,
        lessons_completed: completedLessonsCount,
        total_lessons: totalLessons,
        completed_lesson_ids: completedLessonIds,
        quizzes_completed: completedQuizzesCount,
        total_quizzes: totalQuizzes,
        total_items: totalItems,
        completed_items: completedItems,
        quizzes: moduleQuizData
      };
    }));

    const finalStudentData = {
      ...student,
      progress: {
        modules: moduleProgress
      }
    };
    
    return finalStudentData;
  };
  
  const studentsToShow = (() => {
    if (String(userRole).toLowerCase() === 'parent') {
      // For parent, only show the currently selected child from context (set by Choose/Profile pages)
      if (!selectedChildId) return [];
      const matched = realStudents.filter(s => String(s.id) === String(selectedChildId));
      return matched;
    }
    
    if (String(userRole).toLowerCase() === 'teacher') {
      // For teachers, only show students from their assigned section
      // If teacher has no assigned section, show empty list
      if (!teacherSection) {
        console.log('Teacher has no assigned section, showing no students');
        return [];
      }
      
      // Filter students to only show those in the teacher's section
      const sectionStudents = realStudents.filter(student => {
        const matches = student.section_id === teacherSection.id;
        if (!matches) {
          console.log(`Student ${student.name} (section: ${student.section_id}) does not match teacher section ${teacherSection.id}`);
        }
        return matches;
      });
      
      console.log(`Teacher showing ${sectionStudents.length} students from section ${teacherSection.name}`);
      return sectionStudents;
    }
    
    // For admins and other roles, show all real students
    return realStudents;
  })();
  // Local tab state for sidebar
  const [activeTab, setActiveTab] = useState('Modules');

  // Responsive state: detect mobile widths and adjust layout
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  
  // Sidebar navigation handler
  const handleSidebarNav = (item) => {
    setActiveTab(item);
  };

  // Add spinner animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  
  // Enhanced color scheme
  const colors = {
    primary: '#6366f1',
    primaryLight: '#8b5cf6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
    info: '#3b82f6',
    mainBg: '#ffffff',
    contentBg: '#ffffff',
    cardBg: '#f8fafc',
    sidebarBg: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 100%)',
    borderColor: '#e2e8f0',
    textColor: '#1e293b',
    mutedText: '#64748b',
    lightText: '#94a3b8'
  };

  const spacing = {
    xs: 4, sm: 8, default: 12, md: 16, lg: 24, xl: 32, '2xl': 48
  };

  const borderRadius = {
    sm: '6px', default: '8px', md: '12px', lg: '16px', xl: '20px'
  };

  const shadows = {
    sm: '0 2px 4px rgba(0,0,0,0.06)',
    md: '0 4px 6px rgba(0,0,0,0.07)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
    xl: '0 20px 25px rgba(0,0,0,0.1)'
  };

  // Small helper to darken a hex color by a percentage amount (0-100)
  const darken = (hex, percent) => {
    try {
      const num = parseInt(hex.replace('#',''),16);
      const r = (num >> 16) & 0xFF;
      const g = (num >> 8) & 0xFF;
      const b = num & 0xFF;

      const amt = Math.round(2.55 * percent);
      const R = Math.max(0, Math.min(255, r - amt));
      const G = Math.max(0, Math.min(255, g - amt));
      const B = Math.max(0, Math.min(255, b - amt));

      return `#${(R<<16 | G<<8 | B).toString(16).padStart(6,'0')}`;
    } catch (e) {
      return hex;
    }
  };

  // Convert hex to rgba with alpha (alpha 0-1)
  const hexToRgba = (hex, alpha = 1) => {
    try {
      const clean = hex.replace('#', '');
      const num = parseInt(clean, 16);
      const r = (num >> 16) & 255;
      const g = (num >> 8) & 255;
      const b = num & 255;
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (e) {
      return hex;
    }
  };

  // State management
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [newModuleName, setNewModuleName] = useState('');
  const [newModuleDescription, setNewModuleDescription] = useState('');
  const [newModuleDifficulty, setNewModuleDifficulty] = useState(1);
  const [newModuleDuration, setNewModuleDuration] = useState(60);
  const [newModuleObjectives, setNewModuleObjectives] = useState(['']);
  
  // Lesson modal state
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState(null);
  const [currentLessonId, setCurrentLessonId] = useState(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonDescription, setNewLessonDescription] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  // UI state for created module name (used in toast)
  const [moduleCreatedName, setModuleCreatedName] = useState('');
  const [moduleToastType, setModuleToastType] = useState('created'); // 'created' | 'updated' | 'deleted'
  
  // Quiz modal state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDescription, setNewQuizDescription] = useState('');
  const [newQuizQuestionCount, setNewQuizQuestionCount] = useState(5);
  const [newQuizPassingScore, setNewQuizPassingScore] = useState(70);
  
  // Quiz questions state
  const [quizQuestions, setQuizQuestions] = useState([
    {
      id: 1,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0
    }
  ]);
  
  // Content view modal state
  const [showLessonDetailModal, setShowLessonDetailModal] = useState(false);
  const [showQuizDetailModal, setShowQuizDetailModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [selectedQuizDetail, setSelectedQuizDetail] = useState(null);
  
  // Edit modal states
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [showEditLessonModal, setShowEditLessonModal] = useState(false);
  const [showEditQuizModal, setShowEditQuizModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  
  const [selectedQuiz, setSelectedQuiz] = useState({ moduleIdx: null, quizIdx: null });
  const [hoveredModule, setHoveredModule] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);
  
  const navigate = useNavigate();

  // Get subject name from route
  const { subjectName: routeSubjectName } = useParams();
  const subjectName = routeSubjectName ? decodeURIComponent(routeSubjectName) : 'Mathematics';
  
  // Map subjects to their display colors (used for subject-level forms/controls)
  const subjectColorMap = {
    Mathematics: '#F472B6', // pink-ish
    Language: '#F59E0B', // yellow/orange
    GMRC: '#A67C52', // brown
    'Physical & Natural Environment': '#34D399', // green
    Makabansa: '#8B5CF6' // purple
  };

  const subjectColor = subjectColorMap[subjectName] || colors.primary;
  
  // Map subject names to database IDs
  const getSubjectId = (subjectName) => {
    const subjectMapping = {
      'Mathematics': 'math',
      'Language': 'language', 
      'GMRC': 'gmrc',
      'Physical & Natural Environment': 'environment',
      'Makabansa': 'makabayan',
      'Science': 'environment', // Assuming science maps to environment
      'Statistics & Probability': 'math' // Assuming stats maps to math
    };
    return subjectMapping[subjectName] || subjectName.toLowerCase();
  };

  // Generate a safe slug from a module name and prefix with subject id.
  // Ensures IDs look like other modules (e.g. math_counting, lang_alphabet)
  const slugifyModuleId = (name) => {
    if (!name) return '';
    // Normalize, remove diacritics, lowercase
    let slug = name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_') // replace non-alnum with underscore
      .replace(/^_+|_+$/g, '') // trim leading/trailing underscores
      .replace(/_+/g, '_'); // collapse multiple underscores
    return slug;
  };

  // Ensure generated module id is unique in the database by appending a numeric suffix when needed
  const makeUniqueModuleId = async (baseId, client) => {
    let candidate = baseId;
    let suffix = 1;
    while (true) {
      const { data: exists, error } = await client
        .from('modules')
        .select('id')
        .eq('id', candidate)
        .limit(1);

      if (error) {
        // If there's an error checking, assume candidate is OK (we'll try to insert and let DB return error if collision)
        break;
      }

      if (!exists || exists.length === 0) break;

      candidate = `${baseId}_${suffix}`;
      suffix += 1;
      // safety: don't loop forever
      if (suffix > 50) break;
    }

    return candidate;
  };

  const isUuid = (val) => {
    if (!val || typeof val !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  };
  
  // Subject icons (customize as needed)
  const subjectIcons = {
    Mathematics: BookOpen,
    Language: BookOpen,
    GMRC: BookOpen,
    Science: BookOpen,
    'Statistics & Probability': BookOpen
  };
  
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModuleCreatedToast, setShowModuleCreatedToast] = useState(false);
  const [toastEntity, setToastEntity] = useState('Module');
  // State for which student is selected in the teacher progress view
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showLessonDeleteConfirmation, setShowLessonDeleteConfirmation] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState(null);
  const [lessonModuleIdToDelete, setLessonModuleIdToDelete] = useState(null);
  const [showQuizDeleteConfirmation, setShowQuizDeleteConfirmation] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState(null);
  const [quizModuleIdToDelete, setQuizModuleIdToDelete] = useState(null);

  const location = useLocation();

  // Collapse all modules whenever the route location changes (pathname, search, hash) or when the selected child changes.
  // This covers situations where UI switches views without changing the pathname alone (e.g., query params or child switch).
  useEffect(() => {
    setModules(prev => prev.map(m => ({ ...m, expanded: false })));
  }, [location.pathname, location.search, location.hash, selectedChildId, activeTab]);

  // Create sample modules for fallback
  const createSampleModules = (subject) => {
    const sampleModulesMap = {
      'Mathematics': [
        {
          id: 'math_algebra_basics',
          name: 'Algebra Fundamentals',
          description: 'Learn the basic concepts of algebra including variables, equations, and expressions.',
          learningObjectives: ['Understand variables and expressions', 'Solve linear equations', 'Work with algebraic formulas'],
          difficultyLevel: 2,
          estimatedDuration: 90,
          expanded: false,
          progress: 75,
          students: 24,
          quizzes: ['Linear Equations Quiz', 'Variable Expressions Test'],
          lessons: [
            { title: 'Introduction to Variables', description: 'Understanding algebraic variables', quizzes: 1 },
            { title: 'Linear Equations', description: 'Solving basic linear equations', quizzes: 2 }
          ],
          color: '#6366f1'
        },
        {
          id: 'math_geometry_basics',
          name: 'Geometry Basics',
          description: 'Introduction to geometric shapes, angles, and spatial relationships.',
          learningObjectives: ['Identify geometric shapes', 'Calculate area and perimeter', 'Understand angle relationships'],
          difficultyLevel: 1,
          estimatedDuration: 60,
          expanded: false,
          progress: 60,
          students: 24,
          quizzes: ['Shapes Quiz', 'Area and Perimeter Test'],
          lessons: [
            { title: 'Basic Shapes', description: 'Circles, squares, triangles', quizzes: 1 },
            { title: 'Area Calculations', description: 'Finding area of shapes', quizzes: 1 }
          ],
          color: '#10b981'
        }
      ],
      'Language': [
        {
          id: 'lang_grammar_basics',
          name: 'Grammar Fundamentals',
          description: 'Essential grammar rules and sentence structure.',
          learningObjectives: ['Master parts of speech', 'Construct proper sentences', 'Use correct punctuation'],
          difficultyLevel: 1,
          estimatedDuration: 75,
          expanded: false,
          progress: 80,
          students: 22,
          quizzes: ['Parts of Speech Quiz', 'Sentence Structure Test'],
          lessons: [
            { title: 'Nouns and Pronouns', description: 'Understanding subject words', quizzes: 1 },
            { title: 'Verbs and Tenses', description: 'Action words and timing', quizzes: 2 }
          ],
          color: '#f59e0b'
        }
      ],
      'GMRC': [
        {
          id: 'gmrc_values_education',
          name: 'Values Education',
          description: 'Character development and moral values.',
          learningObjectives: ['Develop good character', 'Understand moral principles', 'Practice good citizenship'],
          difficultyLevel: 1,
          estimatedDuration: 45,
          expanded: false,
          progress: 90,
          students: 26,
          quizzes: ['Values Assessment'],
          lessons: [
            { title: 'Respect and Kindness', description: 'Treating others well', quizzes: 1 }
          ],
          color: '#ef4444'
        }
      ]
    };

    return sampleModulesMap[subject] || [];
  };

  // Fetch students based on user role
  useEffect(() => {
    const fetchStudentsBasedOnRole = async () => {
      if (!userId) return;
      
      if (String(userRole).toLowerCase() === 'teacher') {
        await fetchTeacherSectionAndStudents();
      } else if (String(userRole).toLowerCase() === 'admin') {
        await fetchAllStudents();
      } else if (String(userRole).toLowerCase() === 'parent') {
        await fetchParentChildren();
      }
    };

    const fetchTeacherSectionAndStudents = async () => {
      try {
        setStudentsLoading(true);
        
        // Use admin client for teachers to bypass RLS policies, similar to ClassroomPage
        const client = supabaseAdmin && userRole === 'teacher' ? supabaseAdmin : supabase;
        
        // Fetch sections with teacher info - this mirrors ClassroomPage's approach
        const { data: sectionsData, error: sectionsError } = await client
          .from('sections')
          .select(`
            id, 
            name, 
            time_period, 
            classroom_number, 
            teacher_id, 
            max_students, 
            school_year, 
            is_active, 
            created_at,
            user_profiles(id, first_name, last_name, profile_picture_url)
          `)
          .eq('is_active', true)
          .order('name', { ascending: true });
          
        if (sectionsError) {
          console.error('Error fetching sections:', sectionsError);
          setTeacherSection(null);
          setRealStudents([]);
          return;
        }

        // Find the section assigned to current teacher
        const assignedSection = sectionsData?.find(section => section.teacher_id === userId);
        
        if (assignedSection) {
          console.log('Teacher assigned to section:', assignedSection.name);
          setTeacherSection(assignedSection);
          
          // Fetch students from the assigned section
          const { data: students, error: studentsError } = await client
            .from('students')
            .select(`
              id,
              parent_id,
              section_id,
              first_name,
              last_name,
              student_id,
              profile_picture_url,
              enrollment_date,
              is_active,
              created_at,
              user_profiles:parent_id(id, first_name, last_name, profile_picture_url, email, contact),
              section:sections(id, name)
            `)
            .eq('section_id', assignedSection.id)
            .eq('is_active', true)
            .order('last_name', { ascending: true })
            .order('first_name', { ascending: true });
            
          if (studentsError) {
            console.error('Error fetching students:', studentsError);
            setRealStudents([]);
          } else if (students) {
            // Transform students to match expected format
            const transformedStudents = students.map((student) => ({
              id: student.id,
              name: `${student.first_name} ${student.last_name}`,
              first_name: student.first_name,
              last_name: student.last_name,
              student_id: student.student_id,
              section_id: student.section_id,
              section_name: student.section?.name || assignedSection.name,
              parent_info: student.user_profiles,
              profile_picture_url: student.profile_picture_url,
              enrollment_date: student.enrollment_date,
              progress: {
                modules: [] // Will be populated with actual module data when modules are loaded
              }
            }));
            
            console.log(`Loaded ${transformedStudents.length} students from section ${assignedSection.name}`);
            setRealStudents(transformedStudents);
          }
        } else {
          // Teacher is not assigned to any section
          console.log('Teacher is not assigned to any section');
          setTeacherSection(null);
          setRealStudents([]);
        }
        
      } catch (error) {
        console.error('Error in fetchTeacherSectionAndStudents:', error);
        setTeacherSection(null);
        setRealStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };

    const fetchAllStudents = async () => {
      try {
        setStudentsLoading(true);
        
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select(`
            id,
            first_name,
            last_name,
            student_id,
            section_id,
            profile_picture_url,
            is_active,
            section:sections(id, name)
          `)
          .eq('is_active', true)
          .order('last_name', { ascending: true })
          .order('first_name', { ascending: true });
          
        if (studentsError) {
        } else if (students) {
          const transformedStudents = students.map((student) => ({
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            student_id: student.student_id,
            section_id: student.section_id,
            section_name: student.section?.name,
            progress: {
              modules: []
            }
          }));
          
          setRealStudents(transformedStudents);
        }
      } catch (error) {
      } finally {
        setStudentsLoading(false);
      }
    };

    const fetchParentChildren = async () => {
      try {
        setStudentsLoading(true);
        
        const { data: children, error: childrenError } = await supabase
          .from('students')
          .select(`
            id,
            first_name,
            last_name,
            student_id,
            section_id,
            profile_picture_url,
            is_active,
            section:sections(id, name)
          `)
          .eq('parent_id', userId)
          .eq('is_active', true)
          .order('last_name', { ascending: true })
          .order('first_name', { ascending: true });
          
        if (childrenError) {
        } else if (children) {
          const transformedChildren = children.map((child) => ({
            id: child.id,
            name: `${child.first_name} ${child.last_name}`,
            student_id: child.student_id,
            section_id: child.section_id,
            section_name: child.section?.name,
            progress: {
              modules: []
            }
          }));
          
          setRealStudents(transformedChildren);
        }
      } catch (error) {
      } finally {
        setStudentsLoading(false);
      }
    };
    
    fetchStudentsBasedOnRole();
  }, [userRole, userId]);

  // Real-time subscriptions for teacher section assignments and student changes
  useEffect(() => {
    if (!userId || userRole !== "teacher") return;

    // Subscribe to changes in sections table (when teacher_id is updated)
    const sectionsSubscription = supabase
      .channel('teacher_sections_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sections',
          filter: `teacher_id=eq.${userId}`
        },
        (payload) => {
          console.log('Teacher section assignment changed:', payload);
          // Refresh teacher section and students data
          fetchTeacherSectionAndStudents();
        }
      )
      .subscribe((status) => {
        console.log('Sections subscription status:', status);
      });

    // Subscribe to changes in user_profiles table (when section_id is updated)
    const profilesSubscription = supabase
      .channel('teacher_profiles_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log('Teacher profile changed:', payload);
          // Refresh teacher section and students data
          fetchTeacherSectionAndStudents();
        }
      )
      .subscribe((status) => {
        console.log('Profiles subscription status:', status);
      });

    // Also subscribe to general sections table changes (for newly assigned sections)
    const allSectionsSubscription = supabase
      .channel('all_sections_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sections'
        },
        (payload) => {
          // Check if this update affects the current teacher
          if (payload.new && payload.new.teacher_id === userId) {
            console.log('Teacher got assigned to new section:', payload.new);
            fetchTeacherSectionAndStudents();
          } else if (payload.old && payload.old.teacher_id === userId && payload.new.teacher_id !== userId) {
            console.log('Teacher got unassigned from section:', payload.old);
            fetchTeacherSectionAndStudents();
          }
        }
      )
      .subscribe((status) => {
        console.log('All sections subscription status:', status);
      });

    // Subscribe to student changes in teacher's section
    let studentsSubscription = null;
    if (teacherSection) {
      studentsSubscription = supabase
        .channel('teacher_students_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'students',
            filter: `section_id=eq.${teacherSection.id}`
          },
          (payload) => {
            console.log('Student changed in teacher section:', payload);
            // Re-trigger the students fetch
            fetchTeacherSectionAndStudents();
          }
        )
        .subscribe((status) => {
          console.log('Students subscription status:', status);
        });
    }

    // Cleanup subscriptions on unmount
    return () => {
      sectionsSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
      allSectionsSubscription.unsubscribe();
      if (studentsSubscription) {
        studentsSubscription.unsubscribe();
      }
    };
  }, [userRole, userId, teacherSection?.id]); // Include teacherSection.id to re-subscribe when section changes

  // Update student progress when modules are loaded
  useEffect(() => {
    const updateStudentProgress = async () => {
      if (modules.length > 0 && realStudents.length > 0) {
        
        // Debug: Check what student IDs exist in quiz_attempts table
        const { data: allQuizAttempts, error: debugError } = await supabase
          .from('quiz_attempts')
          .select('student_id, quiz_id, score, attempt_number')
          .limit(10);
          
        
        
        const updatedStudents = await Promise.all(
          realStudents.map(async (student) => {
            return await generateStudentProgress(student, modules);
          })
        );
        
        setRealStudents(updatedStudents);
      }
    };
    
    updateStudentProgress();
  }, [modules]); // Only depend on modules to avoid infinite loop

  // Fetch modules from database based on subject name
  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check which database tables are available
        const tableStatus = await checkDatabaseTables();

        // Run diagnostic but skip subject creation which requires higher permissions
        try {
          await runDatabaseDiagnostic();
          // Skip subject creation which might cause 403 errors
          // if (tableStatus.subjects) {
          //   await createSubjectsIfNeeded();
          // }
        } catch (diagError) {
          // Continue anyway - diagnostic is optional
        }

        // Get the correct subject ID from our mapping
        const subjectId = getSubjectId(subjectName);

        let modulesData = null;
        let modulesError = null;

        try {
          // Fetch modules for this subject using subject_id only
          const result = await supabase
            .from('modules')
            .select(`
              id,
              name,
              description,
              learning_objectives,
              difficulty_level,
              estimated_duration_minutes,
              prerequisite_module_id,
              sort_order,
              is_active,
              thumbnail_url,
              model_3d_url,
              created_at
            `)
            .eq('subject_id', subjectId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

          modulesData = result.data;
          modulesError = result.error;
        } catch (fetchError) {
          modulesError = { message: 'Exception in fetch: ' + fetchError.message };
        }

        if (modulesError || !modulesData) {
          // If modules table doesn't exist or has permissions issues, provide sample data
          const sampleModules = createSampleModules(subjectName);
          setModules(sampleModules);
          setLoading(false);
          return;
        }

        // Handle empty modules data
        if (!modulesData || modulesData.length === 0) {
          setModules([]);
          setLoading(false);
          return;
        }

        // Transform the database data to match the expected format
        const transformedModules = modulesData.map((module, index) => ({
          id: module.id,
          name: module.name,
          description: module.description,
          learningObjectives: module.learning_objectives || [],
          difficultyLevel: module.difficulty_level,
          estimatedDuration: module.estimated_duration_minutes,
          prerequisiteModuleId: module.prerequisite_module_id,
          sortOrder: module.sort_order,
          thumbnailUrl: module.thumbnail_url,
          model3dUrl: module.model_3d_url,
          createdAt: module.created_at,
          expanded: false,
          progress: 0, // Will be calculated from real student progress data
          students: studentsToShow.length, // Actual count of students shown to this user
          quizzes: [], // TODO: Fetch related quizzes
          lessons: [], // Will be populated after fetching lessons
          // Prefer a stored module.color, otherwise use the subject-level color so
          // modules belonging to the same subject share a consistent theme.
          color: module.color || subjectColor
        }));

        // Fetch lessons and quizzes for all modules
        const moduleIds = transformedModules.map(module => module.id);
        
        // Debug: Basic database check (reduced logging for performance)
        
        const lessonsByModule = await lessonUtils.fetchLessonsForModules(moduleIds);
        const quizzesByModule = await quizUtils.fetchQuizzesForModules(moduleIds);
        
        
        // Sample lesson content debug (reduced)
        const totalLessons = Object.values(lessonsByModule).flat().length;
        
        // Sample quiz questions debug (reduced)
        const totalQuizzes = Object.values(quizzesByModule).flat().length;
        
        // Add lessons and quizzes to each module and compute progress
        const modulesWithLessonsAndQuizzes = transformedModules.map(module => {
          const moduleLessons = lessonsByModule[module.id] || [];
          const moduleQuizzes = quizzesByModule[module.id] || [];

          const finalLessons = moduleLessons;
          const finalQuizzes = moduleQuizzes;

          return { 
            ...module, 
            lessons: finalLessons,
            quizzes: finalQuizzes
          };
        });

        // Compute aggregate per-module progress across the whole class using lesson completion markers
        try {
          // Get total students count
          let totalStudents = 0;
          try {
            const { data: allStudents, error: studentsErr } = await supabase.from('students').select('id');
            if (!studentsErr && Array.isArray(allStudents)) {
              totalStudents = allStudents.length;
            } else {
            }
          } catch (e) {
          }

          const modulesWithProgress = modulesWithLessonsAndQuizzes.map(mod => {
            const lessonsList = Array.isArray(mod.lessons) ? mod.lessons : [];

            // Sum completed-by counts across all lessons for this module
            let totalCompletions = 0;
            lessonsList.forEach(lesson => {
              try {
                const ld = lesson.lesson_data || {};
                if (Array.isArray(ld.completed_by)) {
                  totalCompletions += ld.completed_by.length;
                } else if (Array.isArray(lesson.completed_by)) {
                  totalCompletions += lesson.completed_by.length;
                } else if (ld.completed === true || lesson.completed === true) {
                  // If only boolean, count as one completion
                  totalCompletions += 1;
                }
              } catch (e) {
                // ignore malformed lesson data
              }
            });

            // total possible completions = lessons * students
            const possibleCompletions = lessonsList.length * Math.max(totalStudents, 1);
            const progressPercent = possibleCompletions > 0 ? Math.round((totalCompletions / possibleCompletions) * 100) : 0;

            return {
              ...mod,
              progress: progressPercent
            };
          });

          setModules(modulesWithProgress);
        } catch (progressErr) {
          setModules(modulesWithLessonsAndQuizzes);
        }
        
      } catch (err) {
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (subjectName) {
      fetchModules();
    }
  }, [subjectName]);

  const toggleModule = (idx) => {
    setModules(modules => modules.map((mod, i) =>
      i === idx ? { ...mod, expanded: !mod.expanded } : mod
    ));
  };

  // Module deletion is handled by handleDeleteModule defined below

  // Other module operations
  const confirmDeleteModule = (moduleId) => {
    setModuleToDelete(moduleId);
    setShowDeleteConfirmation(true);
  };

  // Reset form functions
  const resetModuleForm = () => {
    setNewModuleName('');
    setNewModuleDescription('');
    setNewModuleDifficulty(1);
    setNewModuleDuration(60);
    setNewModuleObjectives(['']);
  };

  const resetLessonForm = () => {
    setNewLessonTitle('');
    setNewLessonDescription('');
    setNewLessonContent('');
    setCurrentModuleId(null);
  };

  const resetQuizForm = () => {
    setNewQuizTitle('');
    setNewQuizDescription('');
  setNewQuizQuestionCount(5);
  setNewQuizPassingScore(70);
    setCurrentModuleId(null);
    setQuizQuestions([
      {
        id: 1,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        image_url: null,
        image_path: null
      }
    ]);
  };

  // Quiz questions helper functions
  const addQuestion = () => {
    const newQuestion = {
      id: quizQuestions.length + 1,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      image_url: null,
      image_path: null
    };
    setQuizQuestions([...quizQuestions, newQuestion]);
  };

  const removeQuestion = (questionId) => {
    if (quizQuestions.length <= 1) return; // Keep at least one question
    setQuizQuestions(quizQuestions.filter(q => q.id !== questionId));
  };

  const updateQuestion = (questionId, field, value) => {
    setQuizQuestions(quizQuestions.map(q => 
      q.id === questionId 
        ? { ...q, [field]: value }
        : q
    ));
  };

  const updateQuestionOption = (questionId, optionIndex, value) => {
    setQuizQuestions(quizQuestions.map(q => 
      q.id === questionId 
        ? { 
            ...q, 
            options: q.options.map((opt, idx) => 
              idx === optionIndex ? value : opt
            )
          }
        : q
    ));
  };

  const setCorrectAnswer = (questionId, optionIndex) => {
    setQuizQuestions(quizQuestions.map(q => 
      q.id === questionId 
        ? { ...q, correctAnswer: optionIndex }
        : q
    ));
  };

  // Image upload handler for quiz questions
  const handleQuestionImageUpload = async (questionId, file) => {
    if (!file) return;
    
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image file size must be less than 5MB');
        return;
      }
      
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `quiz-question-${questionId}-${Date.now()}.${fileExt}`;
      const filePath = `quiz-images/${fileName}`;
      
      // Try to use supabaseAdmin client first, fallback to regular supabase
      const client = supabaseAdmin || supabase;
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await client.storage
        .from('quiz-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });
      
      if (uploadError) {
        
        // Try alternative approach: convert to base64 and store as data URL
        const reader = new FileReader();
        reader.onload = function(e) {
          const imageDataUrl = e.target.result;
          
          // Update question with base64 image
          setQuizQuestions(prevQuestions => prevQuestions.map(q => 
            q.id === questionId 
              ? { 
                  ...q, 
                  image_url: imageDataUrl,
                  image_path: `local:${fileName}`
                }
              : q
          ));
          
          alert('Image uploaded successfully (stored locally)');
        };
        reader.onerror = function() {
          alert('Failed to process image. Please try a different file.');
        };
        reader.readAsDataURL(file);
        return;
      }
      
      // Get public URL
      const { data: urlData } = client.storage
        .from('quiz-assets')
        .getPublicUrl(filePath);
      
      const imageUrl = urlData.publicUrl;
      
      // Update question with image URL
      setQuizQuestions(prevQuestions => prevQuestions.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              image_url: imageUrl,
              image_path: filePath 
            }
          : q
      ));
      
      alert('Image uploaded successfully!');
      
    } catch (error) {
      alert('Failed to upload image. Please try again.');
    }
  };

  // Remove image from question
  const removeQuestionImage = async (questionId) => {
    const question = quizQuestions.find(q => q.id === questionId);
    if (!question?.image_path) return;
    
    try {
      // Only try to remove from Supabase Storage if it's not a local/base64 image
      if (question.image_path && !question.image_path.startsWith('local:')) {
        const client = supabaseAdmin || supabase;
        await client.storage
          .from('quiz-assets')
          .remove([question.image_path]);
      }
      
      // Update question to remove image
      setQuizQuestions(prevQuestions => prevQuestions.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              image_url: null,
              image_path: null 
            }
          : q
      ));
      
    } catch (error) {
      // Still update the question even if storage removal fails
      setQuizQuestions(prevQuestions => prevQuestions.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              image_url: null,
              image_path: null 
            }
          : q
      ));
    }
  };

  const handleCreateModule = async () => {
    if (!newModuleName.trim()) {
      alert('Please enter a module name');
      return;
    }

    // Validate duration if provided
    if (newModuleDuration !== '' && (isNaN(Number(newModuleDuration)) || Number(newModuleDuration) < 1 || Number(newModuleDuration) > 600)) {
      alert('Please provide a valid duration between 1 and 600 minutes or leave blank');
      return;
    }

    // Validate difficulty
    if (isNaN(Number(newModuleDifficulty)) || Number(newModuleDifficulty) < 1 || Number(newModuleDifficulty) > 5) {
      alert('Please select a difficulty level between 1 and 5');
      return;
    }

    try {
      // Close the modal first to prevent white screen if there's an error
      setShowModuleModal(false);
      
      // Get the correct subject ID using our mapping function  
      const subjectId = getSubjectId(subjectName);

      // Filter out empty objectives
      const learningObjectives = newModuleObjectives
        .map(obj => obj.trim())
        .filter(obj => obj.length > 0);

      // Validate difficulty level constraint (1-5)
      const validDifficulty = Math.max(1, Math.min(5, newModuleDifficulty));
      
      // Generate a human-friendly module id (slug) instead of a random UUID so it matches existing slug-style ids
      const client = supabaseAdmin || supabase;
      const baseSlug = `${subjectId}_${slugifyModuleId(newModuleName.trim())}`;
      let finalModuleId = await makeUniqueModuleId(baseSlug, client);
      // If uniqueness check failed and returned empty, fallback to a UUID
      if (!finalModuleId) finalModuleId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `mod_${Date.now()}`;

      const newModuleData = {
        id: finalModuleId,
        subject_id: subjectId,
        name: newModuleName.trim(),
        description: newModuleDescription.trim() || null,
        learning_objectives: learningObjectives.length > 0 ? learningObjectives : null,
        difficulty_level: validDifficulty,
        // Coerce empty-string durations to null for the DB
        estimated_duration_minutes: newModuleDuration === '' ? null : Number(newModuleDuration),
        prerequisite_module_id: null, // Could be enhanced later to allow selection
        sort_order: modules.length,
        is_active: true,
        thumbnail_url: null,
        model_3d_url: null
        // created_at will be auto-generated by database DEFAULT now()
      };

      try {
        const client = supabaseAdmin || supabase;
        const { data: createdModule, error: createError } = await client
          .from('modules')
          .insert([newModuleData])
          .select()
          .single();

        if (createError) {
          
          // Fallback: Create module locally if database isn't available
          createModuleLocally(newModuleData);
          return;
        }

        // Transform and add to local state
        const transformedModule = {
          id: createdModule.id,
          name: createdModule.name,
          description: createdModule.description,
          learningObjectives: createdModule.learning_objectives || [],
          difficultyLevel: createdModule.difficulty_level,
          estimatedDuration: createdModule.estimated_duration_minutes,
          sortOrder: createdModule.sort_order,
          expanded: false,
          progress: 0,
          students: studentsToShow.length,
          quizzes: [],
          lessons: [],
          // Use the current subject color for newly created modules so they match
          // the selected subject instead of cycling through arbitrary colors.
          color: subjectColor
        };

  setModules([...modules, transformedModule]);
  resetModuleForm();
  // show success toast and save module name
  setModuleCreatedName(transformedModule.name || newModuleName.trim());
  setModuleToastType('created');
  setShowModuleCreatedToast(true);
      } catch (dbError) {
        // Fallback to local storage
        createModuleLocally(newModuleData);
      }
    } catch (error) {
      alert('An unexpected error occurred while creating the module');
      resetModuleForm();
    }
  };
  
  // Helper function to create module locally
  const createModuleLocally = (moduleData) => {
    const localModule = {
      id: moduleData.id,
      name: moduleData.name,
      description: moduleData.description,
      learningObjectives: moduleData.learning_objectives || [],
      difficultyLevel: moduleData.difficulty_level,
      estimatedDuration: moduleData.estimated_duration_minutes,
      sortOrder: moduleData.sort_order,
      expanded: false,
      progress: 0,
      students: studentsToShow.length,
      quizzes: [],
      lessons: [],
      // Local fallback creation should also follow the subject color
      color: subjectColor
    };

  setModules([...modules, localModule]);
  resetModuleForm();
  // show success toast for local fallback too
  setModuleCreatedName(localModule.name || newModuleName.trim());
  setModuleToastType('created');
  setShowModuleCreatedToast(true);
  };

  // Lesson handler functions
  const handleCreateLesson = (moduleId) => {
    setCurrentModuleId(moduleId);
    setShowLessonModal(true);
  };

  const handleSubmitLesson = async () => {
    if (!newLessonTitle.trim() || !newLessonContent.trim()) {
      alert('Please enter both a lesson title and content');
      return;
    }

    try {
      // Ensure module id is a readable slug. If currentModuleId looks like a UUID/hash,
      // create a slug module first (copying fields) and update references.
      let targetModuleId = currentModuleId;
      try {
        const client = supabaseAdmin || supabase;
        if (isUuid(currentModuleId)) {
          // Fetch existing module row
          const { data: existingModule } = await client
            .from('modules')
            .select('*')
            .eq('id', currentModuleId)
            .maybeSingle();

          if (existingModule) {
            // Build a slug id using subject and module name
            const subjectId = existingModule.subject_id || getSubjectId(subjectName);
            const base = `${subjectId}_${slugifyModuleId(existingModule.name || 'module')}`;
            const newModuleId = await makeUniqueModuleId(base, client) || `${subjectId}_${Date.now()}`;

            // Insert new module copy
            const newModuleRow = {
              id: newModuleId,
              subject_id: existingModule.subject_id,
              name: existingModule.name,
              description: existingModule.description,
              learning_objectives: existingModule.learning_objectives,
              difficulty_level: existingModule.difficulty_level,
              estimated_duration_minutes: existingModule.estimated_duration_minutes,
              prerequisite_module_id: existingModule.prerequisite_module_id,
              sort_order: existingModule.sort_order,
              is_active: existingModule.is_active,
              thumbnail_url: existingModule.thumbnail_url,
              model_3d_url: existingModule.model_3d_url,
              created_at: existingModule.created_at
            };

            const { data: inserted, error: insertErr } = await client
              .from('modules')
              .insert([newModuleRow])
              .select()
              .maybeSingle();

            if (!insertErr && inserted) {
              targetModuleId = inserted.id;

              // Update any quizzes/lessons that referenced old module id to point to new id
              await client.from('quizzes').update({ module_id: targetModuleId }).eq('module_id', currentModuleId);
              await client.from('lessons').update({ module_id: targetModuleId }).eq('module_id', currentModuleId);

              // Optionally delete the old module row later (we'll leave it for now)
            } else {
            }
          }
        }
      } catch (e) {
      }

      // Generate a slug id for the lesson itself
      const lessonBase = `lesson_${slugifyModuleId(newLessonTitle.trim())}`;
      // Ensure uniqueness locally by appending timestamp if needed
      const generatedLessonId = `${lessonBase}_${Date.now().toString().slice(-6)}`;

      const lessonData = {
        id: generatedLessonId,
        moduleId: targetModuleId,
        title: newLessonTitle.trim(),
        description: newLessonDescription.trim(),
        content: newLessonContent.trim(),
        lessonData: {},
        sortOrder: 0
      };

      // Try to create in database first
      const createdLesson = await lessonUtils.createLesson(lessonData);
      
      // Update the modules state to include the new lesson
      setModules(prevModules => 
        prevModules.map(module => {
          if (module.id === currentModuleId) {
            return {
              ...module,
              lessons: [...module.lessons, createdLesson]
            };
          }
          return module;
        })
      );

      setShowLessonModal(false);
      resetLessonForm();
  // Show themed toast instead of native alert
  setToastEntity('Lesson');
  setModuleCreatedName(createdLesson?.title || newLessonTitle.trim());
  setModuleToastType('created');
  setShowModuleCreatedToast(true);

    } catch (error) {
      
      // Fallback: create lesson locally if database fails
      const localLesson = {
        id: crypto.randomUUID(),
        title: newLessonTitle.trim(),
        description: newLessonDescription.trim(),
        content: `Welcome to ${newLessonTitle}. This lesson will cover the key concepts and provide hands-on practice.`,
        module_id: currentModuleId,
        quiz_id: null,
        lesson_data: {},
        sort_order: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setModules(prevModules => 
        prevModules.map(module => {
          if (module.id === currentModuleId) {
            return {
              ...module,
              lessons: [...module.lessons, localLesson]
            };
          }
          return module;
        })
      );

      setShowLessonModal(false);
      resetLessonForm();
  // Show themed toast for local fallback
  setToastEntity('Lesson');
  setModuleCreatedName(localLesson.title || newLessonTitle.trim());
  setModuleToastType('created');
  setShowModuleCreatedToast(true);
    }
  };

  const handleLessonClick = (lesson) => {
    setSelectedLesson(lesson);
    setShowLessonDetailModal(true);
  };

  // Quiz handler functions
  const handleCreateQuiz = (moduleId, lessonId = null) => {
    setCurrentModuleId(moduleId);
    setCurrentLessonId(lessonId);
    setShowQuizModal(true);
  };

  const handleSubmitQuiz = async (selectedLessonId = null) => {
    if (!newQuizTitle.trim()) {
      alert('Please enter a quiz title');
      return;
    }
    
    // Validate questions
    const validQuestions = quizQuestions.filter(q => 
      q.question.trim() && 
      q.options.every(opt => opt.trim()) &&
      q.correctAnswer >= 0 && q.correctAnswer < 4
    );

    if (validQuestions.length === 0) {
      alert('Please add at least one complete question with all options filled.');
      return;
    }

    // Format questions for database
    const formattedQuestions = validQuestions.map((q, index) => ({
      id: `q${index + 1}`,
      type: 'multiple_choice',
      question: q.question.trim(),
      options: q.options.map(opt => opt.trim()),
      correct_answer: q.correctAnswer,
      points: Math.floor(100 / validQuestions.length),
      image_url: q.image_url || null,
      image_path: q.image_path || null
    }));

    // Validate numeric quiz settings
    if (newQuizPassingScore !== '' && (isNaN(Number(newQuizPassingScore)) || Number(newQuizPassingScore) < 0 || Number(newQuizPassingScore) > 100)) {
      alert('Passing score must be between 0 and 100');
      return;
    }

    try {
      const quizData = {
        moduleId: currentModuleId,
        title: newQuizTitle.trim(),
        description: newQuizDescription.trim(),
        questions: formattedQuestions,
        passingScore: newQuizPassingScore === '' ? null : Number(newQuizPassingScore),
        shuffleQuestions: false,
        shuffleOptions: true,
        showCorrectAnswers: true,
        allowReview: true,
        total_questions: formattedQuestions.length
      };

      // Try to create in database first
  const createdQuiz = await quizUtils.createQuiz(quizData);
      
      
      // If a lesson was selected when opening the modal, bind the created quiz to that lesson
      if (selectedLessonId) {
        try {
          await lessonUtils.updateLesson(selectedLessonId, { quiz_id: createdQuiz.id });
          // Update local modules state so UI shows the binding immediately
          setModules(prevModules =>
            prevModules.map(m => {
              if (m.id !== currentModuleId) return m;
              return {
                ...m,
                lessons: m.lessons.map(l => l.id === selectedLessonId ? { ...l, quiz_id: createdQuiz.id } : l)
              };
            })
          );
        } catch (bindErr) {
        }
      }

      // Refresh quizzes from database to ensure they display correctly
      const moduleQuizzes = await quizUtils.fetchQuizzesByModule(currentModuleId);
      
      // Update the modules state with refreshed quizzes
      setModules(prevModules => 
        prevModules.map(module => {
          if (module.id === currentModuleId) {
            return {
              ...module,
              quizzes: moduleQuizzes
            };
          }
          return module;
        })
      );

      setShowQuizModal(false);
      resetQuizForm();
  // Show themed toast instead of native alert
  setToastEntity('Quiz');
  setModuleCreatedName(createdQuiz?.title || newQuizTitle.trim());
  setModuleToastType('created');
  setShowModuleCreatedToast(true);

    } catch (error) {
      
      // Fallback: create quiz locally if database fails
      const localQuiz = {
        id: crypto.randomUUID(),
        module_id: currentModuleId,
        title: newQuizTitle.trim(),
        description: newQuizDescription.trim(),
        // Use the validated question count (formattedQuestions length) for local fallback
        total_questions: formattedQuestions.length,
        passing_score: newQuizPassingScore === '' ? null : Number(newQuizPassingScore),
        questions_data: {
          questions: sampleQuestions,
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
      };

      setModules(prevModules => 
        prevModules.map(module => {
          if (module.id === currentModuleId) {
            return {
              ...module,
              quizzes: [...module.quizzes, localQuiz]
            };
          }
          return module;
        })
      );

      setShowQuizModal(false);
      resetQuizForm();
  // Show themed toast for local fallback
  setToastEntity('Quiz');
  setModuleCreatedName(localQuiz.title || newQuizTitle.trim());
  setModuleToastType('created');
  setShowModuleCreatedToast(true);
    }
  };

  const handleQuizClick = (quiz) => {
    // If questions_data is already present, open modal immediately.
    if (quiz?.questions_data && quiz.questions_data.questions && quiz.questions_data.questions.length > 0) {
      setSelectedQuizDetail(quiz);
      setShowQuizDetailModal(true);
      return;
    }

    // Otherwise, fetch the full quiz record (including questions_data).
    (async () => {
      try {
        const client = (typeof supabaseAdmin !== 'undefined' && supabaseAdmin) ? supabaseAdmin : supabase;
        const { data: fullQuiz, error } = await client
          .from('quizzes')
          .select(`*
          `)
          .eq('id', quiz.id)
          .maybeSingle();

        if (error) {
          setSelectedQuizDetail(quiz);
          setShowQuizDetailModal(true);
          return;
        }

        // Normalize questions_data shape: some rows store an array directly while UI
        // expects an object { questions: [...] , settings: {...} }
        const normalized = fullQuiz || quiz;
        try {
          if (normalized && normalized.questions_data && Array.isArray(normalized.questions_data)) {
            normalized.questions_data = {
              questions: normalized.questions_data,
              settings: normalized.questions_data.settings || {}
            };
          }
        } catch (e) {
        }

        setSelectedQuizDetail(normalized);
        setShowQuizDetailModal(true);
      } catch (err) {
        setSelectedQuizDetail(quiz);
        setShowQuizDetailModal(true);
      }
    })();
  };

  // Edit and Delete handler functions
  const handleEditModule = (module) => {
    setEditingModule(module);
    setShowEditModuleModal(true);
  };

  const handleDeleteModule = async (module) => {
    // Open confirmation modal for delete
    confirmDeleteModule(module);
  };

  // Performs the actual deletion (called after user confirms)
  const performDeleteModule = async (module) => {
    if (!module) return;
    try {
      setLoading(true);

      if (!module.id) {
        throw new Error('Module ID is missing');
      }

      const result = await moduleUtils.deleteModule(module.id);

      if (result.success) {
        setModules(prevModules => prevModules.filter(m => m.id !== module.id));
        setModuleCreatedName(module.name || 'Module');
        setModuleToastType('deleted');
        setShowModuleCreatedToast(true);
      } else {
        throw new Error(result.message || 'Failed to delete module');
      }
    } catch (error) {
      alert(`Failed to delete module: ${error.message}`);
    } finally {
      setLoading(false);
      setShowDeleteConfirmation(false);
      setModuleToDelete(null);
    }
  };

  const handleEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setShowEditLessonModal(true);
  };

  const handleDeleteLesson = (lesson, moduleId) => {
    // Open the themed confirmation modal instead of using window.confirm
    setLessonToDelete(lesson);
    setLessonModuleIdToDelete(moduleId);
    setShowLessonDeleteConfirmation(true);
  };

  const performDeleteLesson = async () => {
    if (!lessonToDelete) return;
    setLoading(true);
    try {
      await lessonUtils.deleteLesson(lessonToDelete.id);

      // Update local state
      setModules(prevModules => 
        prevModules.map(module => 
          module.id === lessonModuleIdToDelete 
            ? { ...module, lessons: module.lessons.filter(l => l.id !== lessonToDelete.id) }
            : module
        )
      );

      // Show toast
      setToastEntity('Lesson');
      setModuleCreatedName(lessonToDelete.title || 'Lesson');
      setModuleToastType('deleted');
      setShowModuleCreatedToast(true);

    } catch (error) {
      alert('Failed to delete lesson. Please try again.');
    } finally {
      setLoading(false);
      setShowLessonDeleteConfirmation(false);
      setLessonToDelete(null);
      setLessonModuleIdToDelete(null);
    }
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setShowEditQuizModal(true);
  };

  const handleDeleteQuiz = (quiz, moduleId) => {
    // Open themed confirmation modal
    setQuizToDelete(quiz);
    setQuizModuleIdToDelete(moduleId);
    setShowQuizDeleteConfirmation(true);
  };

  const performDeleteQuiz = async () => {
    if (!quizToDelete) return;
    setLoading(true);
    try {
      await quizUtils.deleteQuiz(quizToDelete.id);

      // Update local state
      setModules(prevModules => 
        prevModules.map(module => 
          module.id === quizModuleIdToDelete 
            ? { ...module, quizzes: module.quizzes.filter(q => q.id !== quizToDelete.id) }
            : module
        )
      );

      // Show toast
      setToastEntity('Quiz');
      setModuleCreatedName(quizToDelete.title || 'Quiz');
      setModuleToastType('deleted');
      setShowModuleCreatedToast(true);

    } catch (error) {
      alert('Failed to delete quiz. Please try again.');
    } finally {
      setLoading(false);
      setShowQuizDeleteConfirmation(false);
      setQuizToDelete(null);
      setQuizModuleIdToDelete(null);
    }
  };

  // Using imported CreateModuleModal component instead

  // Create Lesson Modal Component


  // Edit Module Modal Component
  const EditModuleModal = () => {
    const [isClosing, setIsClosing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');
  const [editDifficulty, setEditDifficulty] = useState(1);
  const [editDuration, setEditDuration] = useState(60);
  const [editObjectives, setEditObjectives] = useState(['']);

    useEffect(() => {
      if (editingModule) {
        setEditName(editingModule.name || '');
        setEditDescription(editingModule.description || '');
        setEditDifficulty(editingModule.difficultyLevel || 1);
        setEditDuration(editingModule.estimatedDuration || 60);
        setEditObjectives(editingModule.learningObjectives || ['']);
      }
    }, [editingModule]);

    const handleClose = () => {
      setIsClosing(true);
      setTimeout(() => {
        setShowEditModuleModal(false);
        setIsClosing(false);
        setEditingModule(null);
        // Reset form
        setEditName('');
        setEditDescription('');
        setEditDifficulty(1);
        setEditDuration(60);
        setEditObjectives(['']);
      }, 200);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      if (!editName.trim()) {
        alert('Please enter a module name');
        return;
      }

      // Validate edit duration
      if (editDuration !== '' && (isNaN(Number(editDuration)) || Number(editDuration) < 1 || Number(editDuration) > 600)) {
        alert('Please provide a valid duration between 1 and 600 minutes or leave blank');
        return;
      }

      try {
        setLoading(true); // Show loading indicator
        
        // Update local state first (optimistic UI update) to prevent white screen issues
        const updatedModules = [...modules];
        const moduleIndex = updatedModules.findIndex(m => m.id === editingModule.id);
        
        if (moduleIndex !== -1) {
          updatedModules[moduleIndex] = {
            ...updatedModules[moduleIndex],
            name: editName.trim(),
            description: editDescription.trim() || "",
            difficultyLevel: editDifficulty,
            estimatedDuration: editDuration,
            learningObjectives: editObjectives.filter(obj => obj.trim().length > 0) || []
          };
          setModules(updatedModules);
        }

        // Log the details for debugging
        
        // Filter out empty learning objectives
        const cleanObjectives = editObjectives.filter(obj => obj.trim().length > 0);
        
        // Create update object
        const updateData = {
          name: editName.trim(),
          description: editDescription.trim() || null,
          difficulty_level: editDifficulty,
          estimated_duration_minutes: editDuration
        };
        
        if (cleanObjectives.length > 0) {
          updateData.learning_objectives = cleanObjectives;
        }
        
        // =====================================================
        // COMPLETELY NEW APPROACH: DIRECT SQL UPDATE VIA RPC
        // =====================================================
        try {
          // First, check if we have access to the admin client
          if (supabaseAdmin) {
            
            // Try with admin client which has higher permissions
            const { error: adminError } = await supabaseAdmin
              .from('modules')
              .update(updateData)
              .eq('id', editingModule.id);
              
            if (!adminError) {
              // show toast for update
              setModuleCreatedName(editName.trim() || editingModule.name);
              setModuleToastType('updated');
              setShowModuleCreatedToast(true);
              // UI was already updated optimistically above via setModules(updatedModules)
              handleClose();
              return;
            } else {
            }
          }
          
          // EMERGENCY SOLUTION: Try a raw SQL approach via RPC call
          // This bypasses Row Level Security policies
          
          try {
            const token = localStorage.getItem('supabase.auth.token');
            const user = supabase.auth.getUser();
            
            // Create an authenticated fetch request to the backend proxy
            const response = await fetch('/api/update-module', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
              },
              body: JSON.stringify({
                moduleId: editingModule.id,
                moduleName: editingModule.name,
                updates: updateData
              })
            });
            
            if (response.ok) {
              const result = await response.json();
              setModuleCreatedName(editName.trim() || editingModule.name);
              setModuleToastType('updated');
              setShowModuleCreatedToast(true);
              handleClose();
              return;
            } else {
              throw new Error("Server update failed");
            }
          } catch (serverErr) {
          }
          
          // DIRECT REST API APPROACH
          
          // Get auth token if available
          const session = supabase.auth.getSession();
          let authHeader = {};
          if (session?.data?.session?.access_token) {
            authHeader = {
              'Authorization': `Bearer ${session.data.session.access_token}`
            };
          }
          
          // Try a direct REST call with auth
          const apiResponse = await fetch(
            `https://nnlpilbjchmucwdjuavl.supabase.co/rest/v1/modules?id=eq.${encodeURIComponent(editingModule.id)}`,
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ubHBpbGJqY2htdWN3ZGp1YXZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTUyODIyMTUsImV4cCI6MjAxMDg1ODIxNX0.nmQl1buH0W0TQJwXWz4NVb4L_GjRFlmupHQspvxzlDI',
                'Prefer': 'return=representation',
                ...authHeader
              },
              body: JSON.stringify(updateData)
            }
          );
          
          if (apiResponse.ok) {
            const apiResult = await apiResponse.json();
            setModuleCreatedName(editName.trim() || editingModule.name);
            setModuleToastType('updated');
            setShowModuleCreatedToast(true);
            handleClose();
            return;
          } else {
            const errorText = await apiResponse.text();
            throw new Error(`API update failed: ${errorText}`);
          }
        }
        catch (dbError) {
          
          // ABSOLUTE LAST RESORT - Create new module with same ID
          try {
            
            // Try deleting the module first
            await supabase
              .from('modules')
              .delete()
              .eq('id', editingModule.id);
              
            // Then recreate with the same ID but updated values
            const newModule = {
              ...editingModule,
              name: editName.trim(),
              description: editDescription.trim() || null,
              difficulty_level: editDifficulty,
              estimated_duration_minutes: editDuration,
              learning_objectives: cleanObjectives.length > 0 ? cleanObjectives : null
            };
            
            const { error: insertError } = await supabase
              .from('modules')
              .insert(newModule);
              
            if (!insertError) {
              alert('Module recreated successfully!');
              handleClose();
              return;
            }
          } catch (finalError) {
          }
          
          // All approaches failed - manual workaround for user
          alert('Database update failed. Your changes will be saved temporarily but will not persist after refresh. Please take a screenshot of your changes for reference.');
          handleClose();
        }
      } 
      catch (error) {
        alert('We encountered a critical error while updating the module. Please try again.');
        handleClose();
      } 
      finally {
        setLoading(false); // Hide loading indicator
      }
    };    if (!editingModule) return null;

    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        background: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{ 
          background: colors.contentBg, 
          padding: spacing['2xl'], 
          borderRadius: borderRadius.xl, 
          boxShadow: shadows.xl, 
          minWidth: 500,
          maxWidth: 600,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          transform: isClosing ? 'scale(0.95)' : 'scale(1)',
          transition: 'transform 0.2s ease-out',
          border: `2px solid ${editingModule?.color || colors.borderColor}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <Edit3 size={28} color={editingModule?.color || colors.success} />
              <h2 style={{ fontWeight: 700, fontSize: '1.8rem', color: editingModule?.color || colors.primary, margin: 0 }}>
                Edit Module
              </h2>
            </div>
            <button onClick={handleClose} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: spacing.sm,
              borderRadius: borderRadius.default, color: colors.mutedText, transition: 'all 0.2s ease'
            }}>
              <X size={24} color={colors.danger} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Local common styles similar to CreateModuleModal */}
            <div style={{ marginBottom: spacing.md }}>
              <label htmlFor="edit-module-name" style={{ display: 'block', marginBottom: spacing.xs, fontSize: '0.9rem', fontWeight: 600, color: colors.textColor }}>
                Module Name *
              </label>
              <input
                id="edit-module-name"
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter module name..."
                style={{
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  border: `2px solid ${colors.borderColor}`,
                  width: '100%',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#ffffff',
                  color: '#333333'
                }}
                onFocus={e => e.target.style.borderColor = editingModule?.color || colors.primary}
                onBlur={e => e.target.style.borderColor = colors.borderColor}
                required
              />
            </div>

            <div style={{ marginBottom: spacing.md }}>
              <label htmlFor="edit-module-description" style={{ display: 'block', marginBottom: spacing.xs, fontSize: '0.9rem', fontWeight: 600, color: colors.textColor }}>
                Module Description
              </label>
              <textarea
                id="edit-module-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Enter module description (optional)..."
                rows={3}
                style={{
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  border: `2px solid ${colors.borderColor}`,
                  width: '100%',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: 80,
                  background: '#ffffff',
                  color: '#333333'
                }}
                onFocus={e => e.target.style.borderColor = editingModule?.color || colors.primary}
                onBlur={e => e.target.style.borderColor = colors.borderColor}
              />
            </div>

            <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.md }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="edit-module-difficulty" style={{ display: 'block', marginBottom: spacing.xs, fontSize: '0.9rem', fontWeight: 600, color: colors.textColor }}>
                  Difficulty Level
                </label>
                <select
                  id="edit-module-difficulty"
                  value={editDifficulty}
                  onChange={(e) => setEditDifficulty(parseInt(e.target.value))}
                  style={{
                    padding: spacing.md,
                    borderRadius: borderRadius.md,
                    border: `2px solid ${colors.borderColor}`,
                    width: '100%',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                    color: '#333333',
                    cursor: 'pointer'
                  }}
                  onFocus={e => e.target.style.borderColor = editingModule?.color || colors.primary}
                  onBlur={e => e.target.style.borderColor = colors.borderColor}
                >
                  <option value={1}>1 - Beginner</option>
                  <option value={2}>2 - Elementary</option>
                  <option value={3}>3 - Intermediate</option>
                  <option value={4}>4 - Advanced</option>
                  <option value={5}>5 - Expert</option>
                </select>
              </div>

              <div style={{ flex: 1 }}>
                <label htmlFor="edit-module-duration" style={{ display: 'block', marginBottom: spacing.xs, fontSize: '0.9rem', fontWeight: 600, color: colors.textColor }}>
                  Duration (minutes)
                </label>
                <input
                  id="edit-module-duration"
                  type="number"
                  value={editDuration}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') setEditDuration('');
                    else setEditDuration(Math.max(1, parseInt(val)));
                  }}
                  min="1"
                  max="600"
                  style={{
                    padding: spacing.md,
                    borderRadius: borderRadius.md,
                    border: `2px solid ${colors.borderColor}`,
                    width: '100%',
                    fontSize: '1rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                    color: '#333333'
                  }}
                  onFocus={e => e.target.style.borderColor = editingModule?.color || colors.primary}
                  onBlur={e => e.target.style.borderColor = colors.borderColor}
                />
              </div>
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', marginBottom: spacing.xs, fontSize: '0.9rem', fontWeight: 600, color: colors.textColor }}>
                Learning Objectives (optional)
              </label>
              {editObjectives.map((objective, index) => (
                <div key={index} style={{ display: 'flex', gap: spacing.sm, marginBottom: spacing.sm }}>
                  <input
                    type="text"
                    value={objective}
                    onChange={(e) => {
                      const newObjectives = [...editObjectives];
                      newObjectives[index] = e.target.value;
                      setEditObjectives(newObjectives);
                    }}
                    placeholder={`Learning objective ${index + 1}...`}
                    style={{
                      flex: 1,
                      padding: spacing.md,
                      borderRadius: borderRadius.md,
                      border: `2px solid ${colors.borderColor}`,
                      width: '100%',
                      fontSize: '1rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: '#ffffff',
                      color: '#333333'
                    }}
                    onFocus={e => e.target.style.borderColor = editingModule?.color || colors.primary}
                    onBlur={e => e.target.style.borderColor = colors.borderColor}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newObjectives = [...editObjectives];
                      newObjectives.splice(index, 1);
                      setEditObjectives(newObjectives.length ? newObjectives : ['']);
                    }}
                    style={{
                      padding: spacing.sm,
                      borderRadius: borderRadius.md,
                      border: `2px solid ${colors.borderColor}`,
                      background: 'transparent',
                      color: colors.danger,
                      cursor: 'pointer'
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setEditObjectives([...editObjectives, ''])}
                style={{
                  padding: spacing.sm,
                  borderRadius: borderRadius.md,
                  border: `2px solid ${editingModule?.color || colors.primaryLight}`,
                  background: editingModule?.color || colors.primaryLight,
                  color: '#fff',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = 0.95 }}
                onMouseLeave={e => { e.currentTarget.style.opacity = 1 }}
              >
                Add Objective
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: spacing.md }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  padding: spacing.md,
                  borderRadius: borderRadius.md,
                  border: `2px solid ${colors.borderColor}`,
                  background: 'transparent',
                  color: colors.textColor,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!editName.trim()}
                style={{
                  padding: `${spacing.md}px ${spacing.lg}px`,
                  borderRadius: borderRadius.md,
                  border: `2px solid ${editingModule?.color || colors.primaryLight}`,
                  background: editingModule?.color || colors.primaryLight,
                  color: '#fff',
                  cursor: (!editName.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (!editName.trim()) ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (editingModule?.color) e.currentTarget.style.background = editingModule.color;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  if (editingModule?.color) e.currentTarget.style.background = editingModule.color;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
              >
                Update Module
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Edit Lesson Modal Component
  const EditLessonModal = () => {
    // Determine a color for this lesson edit modal: prefer lesson -> parent module -> subject -> primary
    const lessonColor = (editingLesson && (editingLesson.color || (modules.find(m => m.id === editingLesson.module_id) || {}).color)) || subjectColor || colors.primary;
    const [isClosing, setIsClosing] = useState(false);
    // lock body scroll while editing a lesson
    useEffect(() => {
      if (!editingLesson) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }, [editingLesson]);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editContent, setEditContent] = useState('');

    useEffect(() => {
      if (editingLesson) {
        setEditTitle(editingLesson.title || '');
        setEditDescription(editingLesson.description || '');
        setEditContent(editingLesson.content || '');
      }
    }, [editingLesson]);

    const handleClose = () => {
      setIsClosing(true);
      setTimeout(() => {
        setShowEditLessonModal(false);
        setIsClosing(false);
        setEditingLesson(null);
        // Reset form
        setEditTitle('');
        setEditDescription('');
        setEditContent('');
      }, 200);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!editTitle.trim()) {
        alert('Please enter a lesson title');
        return;
      }

      try {
        const updates = {
          title: editTitle.trim(),
          description: editDescription.trim(),
          content: editContent.trim(),
          lesson_data: {
            ...editingLesson.lesson_data
          }
        };

        await lessonUtils.updateLesson(editingLesson.id, updates);

        // Update local state
        setModules(prevModules => 
          prevModules.map(module => ({
            ...module,
            lessons: module.lessons.map(l => 
              l.id === editingLesson.id 
                ? { ...l, ...updates }
                : l
            )
          }))
        );

  // Show themed toast instead of native alert
  setToastEntity('Lesson');
  setModuleCreatedName(updates.title || editTitle.trim());
  setModuleToastType('updated');
  setShowModuleCreatedToast(true);
  handleClose();
      } catch (error) {
        alert('Failed to update lesson. Please try again.');
      }
    };

    if (!editingLesson) return null;

    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        background: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{ 
          background: colors.contentBg, 
          padding: spacing['2xl'], 
          borderRadius: borderRadius.xl, 
          boxShadow: shadows.xl, 
          minWidth: 600,
          maxWidth: 700,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          transform: isClosing ? 'scale(0.95)' : 'scale(1)',
          transition: 'transform 0.2s ease-out',
    border: `2px solid ${lessonColor}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <BookOpen size={28} color={lessonColor} />
              <h2 style={{ fontWeight: 700, fontSize: '1.8rem', color: '#000', margin: 0 }}>
                Edit Lesson
              </h2>
            </div>
            <button onClick={handleClose} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: spacing.sm,
              borderRadius: borderRadius.default, color: colors.mutedText, transition: 'all 0.2s ease'
            }}>
                  <X size={24} color={colors.danger} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: spacing.sm, color: colors.textColor }}>
                Lesson Title *
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{
                  width: '100%', padding: spacing.md, borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.borderColor}`, background: colors.cardBg,
                  color: colors.textColor, fontSize: '1rem', transition: 'border-color 0.2s ease',
                  position: 'relative', zIndex: 1
                }}
                placeholder="Enter lesson title"
                required
              />
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: spacing.sm, color: colors.textColor }}>
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                style={{
                  width: '100%', padding: spacing.md, borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.borderColor}`, background: colors.cardBg,
                  color: colors.textColor, fontSize: '1rem', minHeight: 80, resize: 'vertical',
                  transition: 'border-color 0.2s ease', position: 'relative', zIndex: 1
                }}
                placeholder="Enter lesson description"
              />
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: spacing.sm, color: colors.textColor }}>
                Lesson Content
              </label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{
                  width: '100%', padding: spacing.md, borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.borderColor}`, background: colors.cardBg,
                  color: colors.textColor, fontSize: '1rem', minHeight: 120, resize: 'vertical',
                  transition: 'border-color 0.2s ease', position: 'relative', zIndex: 1
                }}
                placeholder="Enter detailed lesson content"
              />
            </div>



            <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleClose} style={{ 
                padding: `${spacing.md}px ${spacing.xl}px`, borderRadius: borderRadius.lg, 
                border: `1px solid ${colors.borderColor}`, background: colors.contentBg, 
                color: colors.textColor, fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                Cancel
              </button>
              <button type="submit" style={{ 
                padding: `${spacing.md}px ${spacing.xl}px`, borderRadius: borderRadius.lg, 
                border: `2px solid ${lessonColor}`, background: lessonColor, 
                color: '#fff', fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                const hover = darken(lessonColor, 10);
                e.currentTarget.style.background = hover;
                e.currentTarget.style.borderColor = hover;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 20px ${hexToRgba(lessonColor,0.18)}`;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = lessonColor;
                e.currentTarget.style.borderColor = lessonColor;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                Update Lesson
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Edit Quiz Modal Component
  const EditQuizModal = () => {
    const [isClosing, setIsClosing] = useState(false);
    // lock body scroll while editing a quiz
    useEffect(() => {
      if (!editingQuiz) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }, [editingQuiz]);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editPassingScore, setEditPassingScore] = useState(70);
  /* editTimeLimit removed - quiz time limit feature removed */
    const [editQuizQuestions, setEditQuizQuestions] = useState([
      {
        id: 1,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0
      }
    ]);

    useEffect(() => {
      if (editingQuiz) {
        setEditTitle(editingQuiz.title || '');
        setEditDescription(editingQuiz.description || '');
        setEditPassingScore(editingQuiz.passing_score || 70);
  // time limit removed for quizzes
        
        // Load existing questions
        if (editingQuiz.questions_data?.questions && editingQuiz.questions_data.questions.length > 0) {
          const existingQuestions = editingQuiz.questions_data.questions.map((q, index) => {
            let correctAnswerIndex = 0;
            
            // Handle different correct_answer formats that might exist in the database
            if (q.correct_answer !== null && q.correct_answer !== undefined) {
              // If it's already a number (0, 1, 2, 3), use it directly
              if (typeof q.correct_answer === 'number') {
                correctAnswerIndex = q.correct_answer;
              }
              // If it's a string number ("0", "1", "2", "3"), convert it
              else if (typeof q.correct_answer === 'string' && /^\d+$/.test(q.correct_answer)) {
                correctAnswerIndex = parseInt(q.correct_answer, 10);
              }
              // If it's a letter ("A", "B", "C", "D"), convert to index
              else if (typeof q.correct_answer === 'string' && /^[A-D]$/i.test(q.correct_answer)) {
                correctAnswerIndex = q.correct_answer.toUpperCase().charCodeAt(0) - 65;
              }
              // If it's the actual option text, find its index in the options array
              else if (typeof q.correct_answer === 'string' && q.options && Array.isArray(q.options)) {
                const foundIndex = q.options.findIndex(option => option === q.correct_answer);
                if (foundIndex !== -1) {
                  correctAnswerIndex = foundIndex;
                }
              }
            }
            
            return {
              id: index + 1,
              question: q.question || '',
              options: q.options || ['', '', '', ''],
              correctAnswer: correctAnswerIndex,
              image_url: q.image_url || null,
              image_path: q.image_path || null
            };
          });
          setEditQuizQuestions(existingQuestions);
        } else {
          setEditQuizQuestions([
            {
              id: 1,
              question: '',
              options: ['', '', '', ''],
              correctAnswer: 0,
              image_url: null,
              image_path: null
            }
          ]);
        }
      }
    }, [editingQuiz]);

    // Refs to support auto-scroll/focus when adding questions
    const questionsContainerRef = useRef(null);
    const editQuestionRefs = useRef({});

    // Quiz questions helper functions for edit modal
    const addEditQuestion = () => {
      const newQuestion = {
        id: Date.now(),
        question: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        image_url: null,
        image_path: null
      };

      // Append to the end (natural order) then scroll to and focus the new question
      setEditQuizQuestions(prev => {
        const updated = [...prev, newQuestion];

        setTimeout(() => {
          const el = editQuestionRefs.current[newQuestion.id];
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            const textarea = el.querySelector && el.querySelector('textarea');
            if (textarea) textarea.focus();
          } else if (questionsContainerRef.current) {
            questionsContainerRef.current.scrollTop = questionsContainerRef.current.scrollHeight;
          }
        }, 50);

        return updated;
      });
    };

    const removeEditQuestion = (questionId) => {
      if (editQuizQuestions.length <= 1) return; // Keep at least one question
      setEditQuizQuestions(editQuizQuestions.filter(q => q.id !== questionId));
    };

    const updateEditQuestion = (questionId, field, value) => {
      setEditQuizQuestions(editQuizQuestions.map(q => 
        q.id === questionId 
          ? { ...q, [field]: value }
          : q
      ));
    };

    const updateEditQuestionOption = (questionId, optionIndex, value) => {
      setEditQuizQuestions(editQuizQuestions.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              options: q.options.map((opt, idx) => 
                idx === optionIndex ? value : opt
              )
            }
          : q
      ));
    };

    const setEditCorrectAnswer = (questionId, optionIndex) => {
      setEditQuizQuestions(editQuizQuestions.map(q => 
        q.id === questionId 
          ? { ...q, correctAnswer: optionIndex }
          : q
      ));
    };

    // Image upload handler for edit quiz questions
    const handleEditQuestionImageUpload = async (questionId, file) => {
      if (!file) return;
      
      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert('Please select a valid image file');
          return;
        }
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('Image file size must be less than 5MB');
          return;
        }
        
        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `quiz-question-edit-${questionId}-${Date.now()}.${fileExt}`;
        const filePath = `quiz-images/${fileName}`;
        
        // Try to use supabaseAdmin client first, fallback to regular supabase
        const client = supabaseAdmin || supabase;
        
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await client.storage
          .from('quiz-assets')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });
        
        if (uploadError) {
          
          // Try alternative approach: convert to base64 and store as data URL
          const reader = new FileReader();
          reader.onload = function(e) {
            const imageDataUrl = e.target.result;
            
            // Update question with base64 image
            setEditQuizQuestions(prevQuestions => prevQuestions.map(q => 
              q.id === questionId 
                ? { 
                    ...q, 
                    image_url: imageDataUrl,
                    image_path: `local:${fileName}`
                  }
                : q
            ));
            
            alert('Image uploaded successfully (stored locally)');
          };
          reader.onerror = function() {
            alert('Failed to process image. Please try a different file.');
          };
          reader.readAsDataURL(file);
          return;
        }
        
        // Get public URL
        const { data: urlData } = client.storage
          .from('quiz-assets')
          .getPublicUrl(filePath);
        
        const imageUrl = urlData.publicUrl;
        
        // Update question with image URL
        setEditQuizQuestions(prevQuestions => prevQuestions.map(q => 
          q.id === questionId 
            ? { 
                ...q, 
                image_url: imageUrl,
                image_path: filePath 
              }
            : q
        ));
        
        alert('Image uploaded successfully!');
        
      } catch (error) {
        alert('Failed to upload image. Please try again.');
      }
    };

    // Remove image from edit quiz question
    const removeEditQuestionImage = async (questionId) => {
      const question = editQuizQuestions.find(q => q.id === questionId);
      if (!question?.image_path) return;
      
      try {
        // Only try to remove from Supabase Storage if it's not a local/base64 image
        if (question.image_path && !question.image_path.startsWith('local:')) {
          const client = supabaseAdmin || supabase;
          await client.storage
            .from('quiz-assets')
            .remove([question.image_path]);
        }
        
        // Update question to remove image
        setEditQuizQuestions(prevQuestions => prevQuestions.map(q => 
          q.id === questionId 
            ? { 
                ...q, 
                image_url: null,
                image_path: null 
              }
            : q
        ));
        
      } catch (error) {
        // Still update the question even if storage removal fails
        setEditQuizQuestions(prevQuestions => prevQuestions.map(q => 
          q.id === questionId 
            ? { 
                ...q, 
                image_url: null,
                image_path: null 
              }
            : q
        ));
      }
    };

    const handleClose = () => {
      setIsClosing(true);
      setTimeout(() => {
        setShowEditQuizModal(false);
        setIsClosing(false);
        setEditingQuiz(null);
        // Reset form
        setEditTitle('');
        setEditDescription('');
        setEditPassingScore(70);
  // time limit removed for quizzes
        setEditQuizQuestions([
          {
            id: 1,
            question: '',
            options: ['', '', '', ''],
            correctAnswer: 0
          }
        ]);
      }, 200);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!editTitle.trim()) {
        alert('Please enter a quiz title');
        return;
      }

      // Validate questions
      const validQuestions = editQuizQuestions.filter(q => 
        q.question.trim() && 
        q.options.every(opt => opt.trim()) &&
        q.correctAnswer >= 0 && q.correctAnswer < 4
      );

      if (validQuestions.length === 0) {
        alert('Please add at least one complete question with all options filled.');
        return;
      }

      try {
        // Format questions for database
        const formattedQuestions = validQuestions.map((q, index) => ({
          id: `q${index + 1}`,
          type: 'multiple_choice',
          question: q.question.trim(),
          options: q.options.map(opt => opt.trim()),
          correct_answer: q.correctAnswer,
          points: Math.floor(100 / validQuestions.length),
          image_url: q.image_url || null,
          image_path: q.image_path || null
        }));

        const updates = {
          title: editTitle.trim(),
          description: editDescription.trim(),
          passing_score: editPassingScore === '' ? null : Math.max(0, Math.min(100, Number(editPassingScore))),
          // time_limit_minutes removed
          questions_data: {
            questions: formattedQuestions,
            total_questions: validQuestions.length
          },
          // Ensure the top-level total_questions column is updated in the database
          total_questions: validQuestions.length
        };

        await quizUtils.updateQuiz(editingQuiz.id, updates);

        // Update local state
        const updated = await quizUtils.updateQuiz(editingQuiz.id, updates);

        // Update local state
        setModules(prevModules => 
          prevModules.map(module => ({
            ...module,
            quizzes: module.quizzes.map(q => 
              q.id === editingQuiz.id 
                ? { ...q, ...updates }
                : q
            )
          }))
        );

  // Show themed toast instead of native alert
  setToastEntity('Quiz');
  setModuleCreatedName(updates.title || editTitle.trim());
  setModuleToastType('updated');
  setShowModuleCreatedToast(true);
  handleClose();
      } catch (error) {
        alert('Failed to update quiz. Please try again.');
      }
    };

    if (!editingQuiz) return null;

    return (
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100vw', 
        height: '100vh', 
        background: 'rgba(0,0,0,0.5)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        zIndex: 9999,
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{ 
          background: colors.contentBg, 
          padding: spacing['2xl'], 
          borderRadius: borderRadius.xl, 
          boxShadow: shadows.xl, 
          minWidth: 600,
          maxWidth: 700,
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          transform: isClosing ? 'scale(0.95)' : 'scale(1)',
          transition: 'transform 0.2s ease-out',
          border: `2px solid ${(editingQuiz && ((editingQuiz.color) || (modules.find(m => m.id === editingQuiz.module_id) || {}).color)) || colors.borderColor}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <Award size={28} color={(editingQuiz && ((editingQuiz.color) || (modules.find(m => m.id === editingQuiz.module_id) || {}).color)) || colors.warning} />
              <h2 style={{ fontWeight: 700, fontSize: '1.8rem', color: '#000', margin: 0 }}>
                Edit Quiz
              </h2>
            </div>
            <button onClick={handleClose} style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: spacing.sm,
              borderRadius: borderRadius.default, color: colors.mutedText, transition: 'all 0.2s ease'
            }}>
              <X size={24} color={colors.danger} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: spacing.sm, color: colors.textColor }}>
                Quiz Title *
              </label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{
                  width: '100%', padding: spacing.md, borderRadius: borderRadius.lg,
                  border: `2px solid ${colors.borderColor}`, background: colors.cardBg,
                  color: colors.textColor, fontSize: '1rem', transition: 'border-color 0.2s ease',
                  position: 'relative', zIndex: 1
                }}
                placeholder="Enter quiz title"
                required
              />
            </div>

            <div style={{ marginBottom: spacing.lg }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: spacing.sm, color: colors.textColor }}>
                Description
              </label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                style={{
                  width: '100%', padding: spacing.md, borderRadius: borderRadius.lg,
                  border: `2px solid ${colors.borderColor}`, background: colors.cardBg,
                  color: colors.textColor, fontSize: '1rem', minHeight: 100, resize: 'vertical',
                  transition: 'border-color 0.2s ease', position: 'relative', zIndex: 1
                }}
                placeholder="Enter quiz description"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: spacing.md, marginBottom: spacing.lg }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, marginBottom: spacing.sm, color: colors.textColor }}>
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  value={editPassingScore}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') setEditPassingScore('');
                    else setEditPassingScore(Math.max(0, Math.min(100, parseInt(val))));
                  }}
                  style={{
                    width: '100%', padding: spacing.md, borderRadius: borderRadius.lg,
                    border: `2px solid ${colors.borderColor}`, background: colors.cardBg,
                    color: colors.textColor, fontSize: '1rem', position: 'relative', zIndex: 1
                  }}
                />
              </div>
              {/* Time limit removed from edit quiz form */}
            </div>

            {/* Quiz Questions Section */}
            <div style={{ marginTop: spacing.xl, marginBottom: spacing.lg }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                <h3 style={{ color: colors.textColor, fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>
                  Quiz Questions ({editQuizQuestions.length})
                </h3>
                <button
                  type="button"
                  onClick={addEditQuestion}
                  style={{
                    padding: `${spacing.sm}px ${spacing.md}px`,
                    borderRadius: borderRadius.md,
                    border: `2px solid ${(editingQuiz && ((editingQuiz.color) || (modules.find(m => m.id === editingQuiz.module_id) || {}).color)) || colors.primary}`,
                    background: (editingQuiz && ((editingQuiz.color) || (modules.find(m => m.id === editingQuiz.module_id) || {}).color)) || colors.primary,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.xs
                  }}
                  onMouseEnter={e => {
                    e.target.style.background = (editingQuiz && ((editingQuiz.color) || (modules.find(m => m.id === editingQuiz.module_id) || {}).color)) || colors.primary;
                    e.target.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = (editingQuiz && ((editingQuiz.color) || (modules.find(m => m.id === editingQuiz.module_id) || {}).color)) || colors.primary;
                    e.target.style.transform = 'translateY(0px)';
                  }}
                >
                  <Plus size={16} />
                  Add Question
                </button>
              </div>

              <div ref={questionsContainerRef} style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: spacing.sm }}>
                {editQuizQuestions.map((question, qIndex) => (
                  <div key={question.id} ref={el => { if (el) editQuestionRefs.current[question.id] = el; }} style={{
                    background: colors.cardBg,
                    padding: spacing.lg,
                    borderRadius: borderRadius.lg,
                    marginBottom: spacing.md,
                    border: `2px solid ${colors.borderColor}`,
                    position: 'relative'
                  }}>
                    {/* Question Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md }}>
                      <h4 style={{ color: colors.textColor, fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                        Question {qIndex + 1}
                      </h4>
                      {editQuizQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditQuestion(question.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: colors.danger,
                            cursor: 'pointer',
                            padding: spacing.xs,
                            borderRadius: borderRadius.sm,
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={e => {
                            e.target.style.background = `${colors.danger}20`;
                          }}
                          onMouseLeave={e => {
                            e.target.style.background = 'none';
                          }}
                        >
                          <Trash2 size={16} color={colors.danger} />
                        </button>
                      )}
                    </div>

                    {/* Question Text */}
                    <div style={{ marginBottom: spacing.md }}>
                      <label style={{
                        display: 'block',
                        marginBottom: spacing.xs,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: colors.textColor
                      }}>
                        Question Text *
                      </label>
                      <textarea
                        value={question.question}
                        onChange={(e) => updateEditQuestion(question.id, 'question', e.target.value)}
                        placeholder="Enter your question here..."
                        style={{
                          width: '100%',
                          padding: spacing.md,
                          borderRadius: borderRadius.md,
                          border: `2px solid ${colors.borderColor}`,
                          background: colors.cardBg,
                          color: colors.textColor,
                          fontSize: '1rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                          transition: 'border-color 0.2s ease',
                          minHeight: '80px',
                          resize: 'vertical',
                          position: 'relative',
                          zIndex: 1
                        }}
                        onFocus={e => e.target.style.borderColor = colors.primary}
                        onBlur={e => e.target.style.borderColor = colors.borderColor}
                      />
                    </div>

                    {/* Question Image Upload Section */}
                    <div style={{ marginBottom: spacing.md }}>
                      <label style={{
                        display: 'block',
                        marginBottom: spacing.xs,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: colors.textColor
                      }}>
                        Question Image (Optional)
                      </label>
                      
                      {question.image_url ? (
                        <div style={{ marginBottom: spacing.sm }}>
                          <img 
                            src={question.image_url} 
                            alt="Question preview" 
                            style={{ 
                              maxWidth: '200px', 
                              maxHeight: '150px', 
                              width: 'auto', 
                              height: 'auto', 
                              borderRadius: borderRadius.md, 
                              border: `1px solid ${colors.borderColor}`,
                              display: 'block',
                              marginBottom: spacing.xs
                            }} 
                          />
                          <button 
                            type="button" 
                            onClick={() => removeEditQuestionImage(question.id)}
                            style={{ 
                              background: colors.danger, 
                              color: 'white', 
                              border: 'none', 
                              padding: `${spacing.xs}px ${spacing.sm}px`, 
                              borderRadius: borderRadius.sm, 
                              fontSize: '0.8rem', 
                              cursor: 'pointer' 
                            }}
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input 
                            type="file" 
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                // Reset the input value so the same file can be selected again if needed
                                e.target.value = '';
                                handleEditQuestionImageUpload(question.id, file);
                              }
                            }}
                            style={{ 
                              width: '100%', 
                              padding: spacing.sm, 
                              border: `1px solid ${colors.borderColor}`, 
                              borderRadius: borderRadius.sm, 
                              fontSize: '0.9rem',
                              cursor: 'pointer',
                              backgroundColor: colors.cardBg
                            }}
                          />
                          <p style={{ 
                            fontSize: '0.8rem', 
                            color: colors.mutedText, 
                            margin: `${spacing.xs}px 0 0 0`, 
                            fontStyle: 'italic' 
                          }}>
                            Supported: JPG, PNG, GIF, WebP. Max: 5MB. If upload fails, image will be stored locally.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Multiple Choice Options */}
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: spacing.sm,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: colors.textColor
                      }}>
                        Answer Options *
                      </label>
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.sm,
                          marginBottom: spacing.sm
                        }}>
                          <input
                            type="radio"
                            name={`correct-${question.id}`}
                            checked={question.correctAnswer === optIndex}
                            onChange={() => setEditCorrectAnswer(question.id, optIndex)}
                            style={{
                              width: '16px',
                              height: '16px',
                              cursor: 'pointer'
                            }}
                          />
                          <div style={{
                            background: question.correctAnswer === optIndex ? `${colors.success}20` : colors.cardBg,
                            border: `2px solid ${question.correctAnswer === optIndex ? colors.success : colors.borderColor}`,
                            borderRadius: borderRadius.sm,
                            padding: spacing.xs,
                            minWidth: '24px',
                            textAlign: 'center',
                            fontWeight: 600,
                            color: question.correctAnswer === optIndex ? colors.success : colors.textColor
                          }}>
                            {String.fromCharCode(65 + optIndex)}
                          </div>
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateEditQuestionOption(question.id, optIndex, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                            style={{
                              flex: 1,
                              padding: spacing.md,
                              borderRadius: borderRadius.md,
                              border: `2px solid ${question.correctAnswer === optIndex ? colors.success : colors.borderColor}`,
                              background: question.correctAnswer === optIndex ? `${colors.success}10` : colors.cardBg,
                              color: colors.textColor,
                              fontSize: '1rem',
                              outline: 'none',
                              boxSizing: 'border-box',
                              transition: 'border-color 0.2s ease',
                              position: 'relative',
                              zIndex: 1
                            }}
                            onFocus={e => e.target.style.borderColor = colors.primary}
                            onBlur={e => e.target.style.borderColor = question.correctAnswer === optIndex ? colors.success : colors.borderColor}
                          />
                        </div>
                      ))}
                      <p style={{
                        fontSize: '0.8rem',
                        color: colors.mutedText,
                        margin: 0,
                        marginTop: spacing.xs,
                        fontStyle: 'italic'
                      }}>
                        Select the radio button next to the correct answer
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
              <button type="button" onClick={handleClose} style={{ 
                padding: `${spacing.md}px ${spacing.xl}px`, borderRadius: borderRadius.lg, 
                border: `2px solid ${colors.borderColor}`, background: colors.contentBg, 
                color: colors.textColor, fontWeight: 600, fontSize: '1rem', cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}>
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!editTitle.trim() || editQuizQuestions.filter(q => 
                  q.question.trim() && 
                  q.options.every(opt => opt.trim()) &&
                  q.correctAnswer >= 0 && q.correctAnswer < 4
                ).length === 0}
                style={{ 
                  padding: `${spacing.md}px ${spacing.xl}px`, borderRadius: borderRadius.lg, 
                  border: `2px solid ${(editingQuiz && ((editingQuiz.color) || (modules.find(m => m.id === editingQuiz.module_id) || {}).color)) || colors.warning}`, background: (editingQuiz && ((editingQuiz.color) || (modules.find(m => m.id === editingQuiz.module_id) || {}).color)) || colors.warning, 
                  color: '#fff', fontWeight: 600, fontSize: '1rem', 
                  cursor: (!editTitle.trim() || editQuizQuestions.filter(q => 
                    q.question.trim() && 
                    q.options.every(opt => opt.trim()) &&
                    q.correctAnswer >= 0 && q.correctAnswer < 4
                  ).length === 0) ? 'not-allowed' : 'pointer',
                  opacity: (!editTitle.trim() || editQuizQuestions.filter(q => 
                    q.question.trim() && 
                    q.options.every(opt => opt.trim()) &&
                    q.correctAnswer >= 0 && q.correctAnswer < 4
                  ).length === 0) ? 0.6 : 1,
                  transition: 'all 0.2s ease'
                }}
              >
                Update Quiz
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Lesson Detail Modal Component
  const LessonDetailModal = () => {
    const [isClosing, setIsClosing] = useState(false);
    
    const handleClose = () => {
      setIsClosing(true);
      setTimeout(() => {
        setShowLessonDetailModal(false);
        setIsClosing(false);
        setSelectedLesson(null);
      }, 200);
    };

    // Determine a color for this lesson view: lesson -> parent module -> subject -> primary
    const lessonColor = (selectedLesson && (selectedLesson.color || (modules.find(m => m.id === selectedLesson.module_id) || {}).color)) || subjectColor || colors.primary;

    if (!selectedLesson) return null;

    return (
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 9999,
          backdropFilter: 'blur(4px)',
          animation: 'none'
        }}
  // clicking the backdrop no longer closes the modal; require explicit close
      >
        <div 
          style={{ 
            background: colors.contentBg, 
            padding: spacing['2xl'], 
            borderRadius: borderRadius.xl, 
            boxShadow: shadows.xl, 
            minWidth: 600,
            maxWidth: 800,
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            transform: isClosing ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.2s ease-out',
            position: 'relative',
            zIndex: 10000,
            border: `2px solid ${lessonColor}`
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: spacing.lg 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <BookOpen size={28} color={lessonColor} />
              <h2 style={{ fontWeight: 700, fontSize: '1.8rem', color: '#000', margin: 0 }}>
                {selectedLesson.title}
              </h2>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: spacing.sm,
                borderRadius: borderRadius.default,
                color: colors.mutedText,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = colors.cardBg;
                e.target.style.color = colors.textColor;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.color = colors.mutedText;
              }}
            >
                  <X size={24} color={colors.danger} />
            </button>
          </div>

          {/* Lesson Details */}
          <div style={{ 
            background: colors.cardBg, 
            padding: spacing.lg, 
            borderRadius: borderRadius.lg, 
            marginBottom: spacing.lg,
            border: `1px solid ${hexToRgba(lessonColor, 0.22)}`
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.lg, marginBottom: spacing.md }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                {/* difficulty removed per user request */}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                <Users size={16} color={colors.info} />
                <span style={{ fontSize: '0.95rem', color: colors.textColor, fontWeight: 500 }}>
                  Interactive
                </span>
              </div>
            </div>
            
            {selectedLesson.description && (
              <p style={{ 
                color: colors.mutedText, 
                fontSize: '1rem', 
                lineHeight: 1.6, 
                margin: 0,
                fontStyle: 'italic'
              }}>
                {selectedLesson.description}
              </p>
            )}
          </div>

          {/* Lesson Content */}
          <div style={{ 
            background: colors.contentBg, 
            padding: spacing.lg, 
            borderRadius: borderRadius.lg, 
            marginBottom: spacing.lg,
            border: `2px solid ${hexToRgba(lessonColor, 0.12)}`
          }}>
            <h3 style={{ 
              color: colors.textColor, 
              fontSize: '1.3rem', 
              fontWeight: 600, 
              marginBottom: spacing.md,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm
            }}>
              <FileText size={20} color={lessonColor} />
              Lesson Content
            </h3>
            <div style={{ 
              color: colors.textColor, 
              fontSize: '1rem', 
              lineHeight: 1.7,
              padding: spacing.md,
              background: '#f8f9fa',
              borderRadius: borderRadius.md,
              border: `1px solid ${colors.borderColor}`,
              minHeight: 200
            }}>
              {selectedLesson.content ? (
                <div>
                  {selectedLesson.content}

                </div>
              ) : (
                <div style={{ color: colors.mutedText, fontStyle: 'italic' }}>
                  Welcome to {selectedLesson.title}. This lesson will cover the key concepts and provide hands-on practice.

                </div>
              )}
            </div>
          </div>

          {/* Close Button */}
          <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center' }}>
            <button 
              onClick={handleClose}
              style={{ 
                padding: `${spacing.md}px ${spacing.xl}px`, 
                borderRadius: borderRadius.lg, 
                border: `2px solid ${colors.borderColor}`, 
                background: colors.contentBg, 
                color: colors.textColor, 
                fontWeight: 600, 
                fontSize: '1rem', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm
              }}
              onMouseEnter={e => {
                e.target.style.background = colors.cardBg;
                e.target.style.borderColor = colors.mutedText;
              }}
              onMouseLeave={e => {
                e.target.style.background = colors.contentBg;
                e.target.style.borderColor = colors.borderColor;
              }}
            >
              <ArrowLeft size={16} />
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Quiz Detail Modal Component
  const QuizDetailModal = () => {
    const [isClosing, setIsClosing] = useState(false);
    
    const handleClose = () => {
      setIsClosing(true);
      setTimeout(() => {
        setShowQuizDetailModal(false);
        setIsClosing(false);
        setSelectedQuizDetail(null);
      }, 200);
    };

  if (!selectedQuizDetail) return null;

  // Determine the quiz/module color (falls back to module color or primary)
  const quizColor = (selectedQuizDetail && ((selectedQuizDetail.color) || (modules.find(m => m.id === selectedQuizDetail.module_id) || {}).color)) || colors.primary;

  const questions = selectedQuizDetail.questions_data?.questions || [];
  const questionsCount = questions.length || selectedQuizDetail.total_questions || 0;

    return (
      <div 
        style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 9999,
          backdropFilter: 'blur(4px)',
          animation: 'none'
        }}
  // clicking the backdrop no longer closes the modal; require explicit close
      >
        <div 
          style={{ 
            background: colors.contentBg, 
            padding: spacing['2xl'], 
            borderRadius: borderRadius.xl, 
            boxShadow: shadows.xl, 
            minWidth: 600,
            maxWidth: 800,
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            transform: isClosing ? 'scale(0.95)' : 'scale(1)',
            transition: 'transform 0.2s ease-out',
            position: 'relative',
            zIndex: 10000,
            border: `2px solid ${quizColor}`
          }}
          onClick={e => e.stopPropagation()}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: spacing.lg 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
              <Award size={28} color={quizColor} />
              <h2 style={{ fontWeight: 700, fontSize: '1.8rem', color: '#000', margin: 0 }}>
                {selectedQuizDetail.title}
              </h2>
            </div>
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: spacing.sm,
                borderRadius: borderRadius.default,
                color: colors.mutedText,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = colors.cardBg;
                e.target.style.color = colors.textColor;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'none';
                e.target.style.color = colors.mutedText;
              }}
            >
                      <X size={24} color={colors.danger} />
            </button>
          </div>

          {/* Quiz Details */}
          <div style={{ 
            background: colors.cardBg, 
            padding: spacing.lg, 
            borderRadius: borderRadius.lg, 
            marginBottom: spacing.lg,
            border: `1px solid ${colors.borderColor}`
          }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: spacing.md, marginBottom: spacing.md }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                <FileText size={16} color={colors.primary} />
                <span style={{ fontSize: '0.95rem', color: colors.textColor, fontWeight: 500 }}>
                  {questionsCount} questions
                </span>
              </div>
              {/* quiz time limit removed from details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                <TrendingUp size={16} color={colors.success} />
                <span style={{ fontSize: '0.95rem', color: colors.textColor, fontWeight: 500 }}>
                  {selectedQuizDetail.passing_score || 70}% to pass
                </span>
              </div>
            </div>
            
            {selectedQuizDetail.description && (
              <p style={{ 
                color: colors.mutedText, 
                fontSize: '1rem', 
                lineHeight: 1.6, 
                margin: 0,
                fontStyle: 'italic'
              }}>
                {selectedQuizDetail.description}
              </p>
            )}
          </div>

          {/* Questions List */}
          {selectedQuizDetail.questions_data?.questions?.length > 0 && (
            <div style={{ 
              background: colors.contentBg, 
              padding: spacing.lg, 
              borderRadius: borderRadius.lg, 
              marginBottom: spacing.lg,
              border: `2px solid ${quizColor}20`,
              maxHeight: '60vh',
              overflowY: 'auto'
            }}>
              <h3 style={{ 
                color: colors.textColor, 
                fontSize: '1.3rem', 
                fontWeight: 600, 
                marginBottom: spacing.md,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm
              }}>
                <Award size={20} color={quizColor} />
                Questions
              </h3>
              {selectedQuizDetail.questions_data?.questions?.map((question, index) => (
                <div key={index} style={{ 
                  padding: spacing.md,
                  background: '#f8f9fa',
                  borderRadius: borderRadius.md,
                  border: `1px solid ${colors.borderColor}`,
                  marginBottom: spacing.sm
                }}>
                  <p style={{ 
                    color: colors.textColor, 
                    fontSize: '1rem', 
                    fontWeight: 500,
                    margin: 0,
                    marginBottom: spacing.xs
                  }}>
                    Q{index + 1}: {question.question}
                  </p>
                  
                  {/* Render question image if it exists */}
                  {question.image_url && (
                    <div style={{ 
                      marginBottom: spacing.md,
                      marginTop: spacing.sm,
                      textAlign: 'center'
                    }}>
                      <img 
                        src={question.image_url} 
                        alt={`Question ${index + 1} image`}
                        style={{ 
                          maxWidth: '100%',
                          maxHeight: '300px',
                          width: 'auto',
                          height: 'auto',
                          borderRadius: borderRadius.md,
                          border: `2px solid ${colors.borderColor}`,
                          boxShadow: shadows.sm,
                          cursor: 'pointer'
                        }}
                        onClick={(e) => {
                          // Open image in new tab when clicked
                          window.open(question.image_url, '_blank');
                        }}
                        onError={(e) => {
                          // Hide image if it fails to load
                          e.target.style.display = 'none';
                        }}
                      />
                      <p style={{
                        fontSize: '0.8rem',
                        color: colors.mutedText,
                        margin: '4px 0 0 0',
                        fontStyle: 'italic'
                      }}>
                        Click image to view full size
                      </p>
                    </div>
                  )}
                  
                  {question.options && (
                    <div style={{ marginLeft: spacing.md }}>
                      {question.options.map((option, optIndex) => {
                        const isCorrect = question.correct_answer === optIndex || 
                                        question.correct_answer === String.fromCharCode(65 + optIndex) ||
                                        question.correct_answer === option;
                        // hide correct answer indication from students/parents
                        const role = localStorage.getItem('userRole')?.toLowerCase();
                        const showCorrect = !(role === 'parent' || role === 'student');
                        return (
                          <p key={optIndex} style={{ 
                            color: showCorrect && isCorrect ? colors.success : colors.mutedText, 
                            fontSize: '0.9rem', 
                            margin: 0,
                            marginBottom: spacing.xs,
                            fontWeight: showCorrect && isCorrect ? 600 : 400,
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.xs
                          }}>
                            {String.fromCharCode(65 + optIndex)}. {option}
                            {showCorrect && isCorrect && (
                              <span style={{ 
                                color: colors.success, 
                                fontWeight: 700,
                                fontSize: '0.8rem'
                              }}>
                                ✓ Correct
                              </span>
                            )}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Close Button */}
          <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center' }}>
            <button 
              onClick={handleClose}
              style={{ 
                padding: `${spacing.md}px ${spacing.xl}px`, 
                borderRadius: borderRadius.lg, 
                border: `2px solid ${colors.borderColor}`, 
                background: colors.contentBg, 
                color: colors.textColor, 
                fontWeight: 600, 
                fontSize: '1rem', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.sm
              }}
              onMouseEnter={e => {
                e.target.style.background = colors.cardBg;
                e.target.style.borderColor = colors.mutedText;
              }}
              onMouseLeave={e => {
                e.target.style.background = colors.contentBg;
                e.target.style.borderColor = colors.borderColor;
              }}
            >
              <ArrowLeft size={16} />
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ModuleCard = ({ module, index }) => {
    const isHovered = hoveredModule === index;
    
    // Calculate the progress for the current student (parent/student view)
    // For teacher/admin, use the class average (module.progress)
    let displayProgress = module.progress || 0;
    
    if ((userRole === 'parent' || userRole === 'student') && studentsToShow.length > 0) {
      // For parent/student view, get the individual student's progress
      const currentStudent = studentsToShow[0]; // Parent/student will only have one student in the array
      if (currentStudent?.progress?.modules) {
        const studentModuleProgress = currentStudent.progress.modules.find(
          m => String(m.id) === String(module.id) || m.title === module.name
        );
        if (studentModuleProgress) {
          displayProgress = studentModuleProgress.completion || 0;
        }
      }
    }
    
    return (
      <div 
        style={{ 
          background: colors.contentBg,
          border: `2px solid ${module.color || colors.borderColor}`, 
          borderRadius: borderRadius.lg, 
          marginBottom: spacing.lg, 
          boxShadow: isHovered ? shadows.lg : shadows.md,
          transition: 'all 0.3s ease',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0px)',
          overflow: 'hidden'
        }}
        onMouseEnter={() => setHoveredModule(index)}
        onMouseLeave={() => setHoveredModule(null)}
      >
        <div
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            padding: spacing.lg,
            background: module.expanded ? `linear-gradient(135deg, ${module.color}10, ${module.color}05)` : colors.contentBg,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            borderBottom: module.expanded ? `1px solid ${colors.borderColor}` : 'none'
          }}
          onClick={() => toggleModule(index)}
        >
          <div 
            style={{ 
              width: 6, 
              height: 40, 
              background: module.color, 
              borderRadius: borderRadius.sm, 
              marginRight: spacing.md,
              transition: 'all 0.3s ease'
            }} 
          />
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.xs }}>
              <BookOpen size={20} color={module.color} style={{ marginRight: spacing.sm }} />
              <h3 style={{ 
                fontWeight: 700, 
                fontSize: '1.25rem', 
                margin: 0, 
                color: colors.textColor,
                flex: 1
              }}>
                {module.name}
              </h3>
              {module.difficultyLevel && (
                <div style={{
                  marginLeft: spacing.sm,
                  padding: `${spacing.xs}px ${spacing.sm}px`,
                  background: `${module.color}20`,
                  color: module.color,
                  borderRadius: borderRadius.sm,
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  {getDifficultyCategory(module.difficultyLevel)}
                </div>
              )}
              {/* Display progress percentage (hidden for teacher view) */}
              {String(userRole).toLowerCase() !== 'teacher' && (
                <div style={{
                  marginLeft: spacing.sm,
                  padding: `${spacing.xs}px ${spacing.md}px`,
                  background: `${module.color}15`,
                  color: module.color,
                  borderRadius: borderRadius.default,
                  fontSize: '1rem',
                  fontWeight: 700,
                  minWidth: '60px',
                  textAlign: 'center'
                }}>
                  {displayProgress}%
                </div>
              )}
            </div>
            
            {module.description && (
              <p style={{
                fontSize: '0.95rem',
                color: colors.mutedText,
                margin: `0 0 ${spacing.sm}px 0`,
                lineHeight: 1.5
              }}>
                {module.description}
              </p>
            )}
            
            <div style={{ display: 'flex', gap: spacing.lg, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                <FileText size={16} color={colors.mutedText} />
                <span style={{ fontSize: '0.9rem', color: colors.mutedText }}>
                  {module.quizzes?.length || 0} quiz{(module.quizzes?.length || 0) !== 1 ? 'es' : ''}
                </span>
              </div>
              
              {module.estimatedDuration && (
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                  <Calendar size={16} color={colors.mutedText} />
                  <span style={{ fontSize: '0.9rem', color: colors.mutedText }}>
                    {Math.floor(module.estimatedDuration / 60)}h {module.estimatedDuration % 60}m
                  </span>
                </div>
              )}

              {module.difficultyLevel && (
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                  <TrendingUp size={16} color={colors.mutedText} />
                  <span style={{ fontSize: '0.9rem', color: colors.mutedText }}>
                    {getDifficultyCategory(module.difficultyLevel).replace(/[()]/g, '')}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                <Award size={16} color={colors.mutedText} />
                <span style={{ fontSize: '0.9rem', color: colors.mutedText }}>
                  {(module.learningObjectives?.length || 0)} objective{(module.learningObjectives?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            
            {(userRole === 'admin' || userRole === 'teacher') && (
              <>
                <button
                  style={{ 
                    padding: spacing.sm, 
                    borderRadius: borderRadius.sm, 
                    border: 'none', 
                    background: colors.cardBg, 
                    color: module.color || colors.mutedText, 
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditModule(module);
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => { e.currentTarget.style.background = colors.cardBg; e.currentTarget.style.transform = 'translateY(0)'; }}
                  title="Edit Module"
                >
                  <Edit3 size={16} color={colors.success} />
                </button>
                <button
                  style={{ 
                    padding: spacing.sm, 
                    borderRadius: borderRadius.sm, 
                    border: 'none', 
                    background: colors.cardBg, 
                    color: module.color || colors.mutedText, 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteModule(module);
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = colors.cardBg; e.currentTarget.style.transform = 'translateY(0)'; }}
                  title="Delete Module"
                >
                  <Trash2 size={16} color={colors.danger} />
                </button>
              </>
            )}

            <div style={{ 
              transform: module.expanded ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease',
              color: colors.mutedText
            }}>
              <ChevronRight size={20} />
            </div>
          </div>
        </div>

        {module.expanded && (
          <div style={{ 
            padding: spacing.lg,
            background: colors.cardBg,
            animation: 'none'
          }}>
            {/* Learning Objectives */}
            {module.learningObjectives && module.learningObjectives.length > 0 && (
              <div style={{ marginBottom: spacing.lg }}>
                <h4 style={{ fontWeight: 600, fontSize: '1.1rem', color: colors.textColor, marginBottom: spacing.md, display: 'flex', alignItems: 'center' }}>
                  <Award size={18} color={module.color} style={{ marginRight: spacing.xs }} />
                  Learning Objectives
                </h4>
                <ul style={{ 
  listStyle: 'none', 
  padding: spacing.md,  // Keep only this one
  margin: 0,
  background: colors.contentBg,
  borderRadius: borderRadius.md,
  border: `1px solid ${colors.borderColor}`
}}>
                  {module.learningObjectives.map((objective, idx) => (
                    <li key={idx} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      marginBottom: spacing.sm,
                      fontSize: '0.95rem',
                      color: colors.textColor,
                      lineHeight: 1.5
                    }}>
                      <span style={{ 
                        color: module.color, 
                        marginRight: spacing.xs,
                        fontWeight: 'bold',
                        minWidth: '16px'
                      }}>
                        •
                      </span>
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Render lessons above quizzes */}
            {(module.lessons || []).length >= 0 && (
              <div style={{ marginBottom: spacing.lg }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                  <h4 style={{ fontWeight: 600, fontSize: '1.1rem', color: colors.textColor, margin: 0 }}>
                    Lessons ({module.lessons.length})
                  </h4>
                    {userRole !== 'parent' && (
                    <button
                      onClick={() => handleCreateLesson(module.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: subjectColor,
                        color: 'white',
                        border: 'none',
                        borderRadius: borderRadius.sm,
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => e.target.style.opacity = '0.9'}
                      onMouseLeave={e => e.target.style.opacity = '1'}
                    >
                      <Plus size={14} color="#fff" />
                      Add Lesson
                    </button>
                  )}
                </div>
                {module.lessons.map((lesson, lIdx) => {
                  // Check if the student has completed this lesson
                  let isLessonCompleted = false;
                  if ((userRole === 'parent' || userRole === 'student') && studentsToShow.length > 0) {
                    const currentStudent = studentsToShow[0];
                    if (currentStudent?.progress?.modules) {
                      const studentModuleProgress = currentStudent.progress.modules.find(
                        m => String(m.id) === String(module.id) || m.title === module.name
                      );
                      // Check if this lesson ID is in the completed lessons array
                      if (studentModuleProgress?.completed_lesson_ids) {
                        isLessonCompleted = studentModuleProgress.completed_lesson_ids.some(
                          completedId => String(completedId) === String(lesson.id)
                        );
                      }
                    }
                  }
                  
                  return (
                  <div key={lesson.id} style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: spacing.md,
                    background: colors.contentBg,
                    borderRadius: borderRadius.md,
                    border: `1px solid ${colors.borderColor}`,
                    marginBottom: spacing.md,
                    boxShadow: shadows.sm,
                    transition: 'all 0.2s ease',
                    minHeight: '72px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = module.color;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onClick={() => handleLessonClick(lesson)}
                  >
                    <BookOpen size={18} color={module.color} style={{ marginRight: spacing.md }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                        <h5 style={{ fontWeight: 600, fontSize: '1.05rem', margin: 0, color: colors.textColor }}>
                          {lesson.title}
                        </h5>
                        {/* Completion status indicator for students/parents */}
                        {(userRole === 'parent' || userRole === 'student') && isLessonCompleted && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: spacing.xs,
                            padding: `${spacing.xs}px ${spacing.sm}px`,
                            background: `${colors.success}20`,
                            color: colors.success,
                            borderRadius: borderRadius.sm,
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            <Check size={12} />
                            <span>Completed</span>
                          </div>
                        )}
                      </div>
                      <p style={{ color: colors.mutedText, margin: 0, marginTop: 4, fontSize: '0.9rem' }}>
                        {lesson.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginTop: 8 }}>
                        {lesson.quiz_id && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                            <FileText size={14} color={colors.mutedText} />
                            <span style={{ fontSize: '0.85rem', color: colors.mutedText }}>Has Quiz</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {(userRole === 'admin' || userRole === 'teacher') && (
                      <div style={{ display: 'flex', gap: spacing.sm, marginLeft: spacing.md }}>
                            <button
                              style={{
                                padding: spacing.sm,
                                borderRadius: borderRadius.sm,
                                border: 'none',
                                background: colors.cardBg,
                                color: module.color || colors.mutedText,
                                cursor: 'pointer',
                                transition: 'all 0.12s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditLesson(lesson);
                              }}
                              onMouseEnter={e => {
                                  e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                                  e.currentTarget.style.transform = 'translateY(-1px)';
                              }}
                                onMouseLeave={e => { e.currentTarget.style.background = colors.cardBg; e.currentTarget.style.transform = 'translateY(0)'; }}
                              title="Edit Lesson"
                            >
                              <Edit3 size={14} color={colors.success} />
                            </button>
                            <button
                              style={{
                                padding: spacing.sm,
                                borderRadius: borderRadius.sm,
                                border: 'none',
                                background: colors.cardBg,
                                color: module.color || colors.mutedText,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLesson(lesson, module.id);
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = colors.cardBg; e.currentTarget.style.transform = 'translateY(0)'; }}
                              title="Delete Lesson"
                            >
                              <Trash2 size={14} color={colors.danger} />
                            </button>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
            {/* Render quizzes below lessons */}
            {(module.quizzes || []).length >= 0 && (
              <div style={{ marginBottom: spacing.lg }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }}>
                  <h4 style={{ fontWeight: 600, fontSize: '1.1rem', color: colors.textColor, margin: 0 }}>
                    Quizzes ({module.quizzes.length})
                  </h4>
                  {userRole !== 'parent' && (
                    <button
                      onClick={() => handleCreateQuiz(module.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: subjectColor,
                        color: 'white',
                        border: 'none',
                        borderRadius: borderRadius.sm,
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => e.target.style.opacity = '0.9'}
                      onMouseLeave={e => e.target.style.opacity = '1'}
                    >
                      <Plus size={14} color="#fff" />
                      Add Quiz
                    </button>
                  )}
                </div>
                {module.quizzes.map((quiz, qIdx) => {
                  // Get student's quiz attempt data if viewing as parent/student
                  let studentQuizData = null;
                  if ((userRole === 'parent' || userRole === 'student') && studentsToShow.length > 0) {
                    const currentStudent = studentsToShow[0];
                    if (currentStudent?.progress?.modules) {
                      const studentModuleProgress = currentStudent.progress.modules.find(
                        m => String(m.id) === String(module.id) || m.title === module.name
                      );
                      if (studentModuleProgress?.quizzes?.details) {
                        studentQuizData = studentModuleProgress.quizzes.details.find(
                          q => String(q.quiz_id) === String(quiz.id)
                        );
                      }
                    }
                  }
                  
                  return (
                  <div key={quiz.id} style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: spacing.md,
                    background: colors.contentBg,
                    borderRadius: borderRadius.md,
                    border: `1px solid ${colors.borderColor}`,
                    marginBottom: spacing.md,
                    boxShadow: shadows.sm,
                    transition: 'all 0.2s ease',
                    minHeight: '72px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = module.color;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = colors.borderColor;
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  onClick={() => handleQuizClick(quiz)}
                  >
                    <FileText size={18} color={module.color} style={{ marginRight: spacing.md }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h5 style={{ fontWeight: 600, fontSize: '1.05rem', margin: 0, color: colors.textColor }}>
                        {quiz.title}
                      </h5>
                      <p style={{ color: colors.mutedText, margin: 0, marginTop: 4, fontSize: '0.9rem' }}>
                        {quiz.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? spacing.sm : spacing.md, marginTop: isMobile ? 6 : 8, flexWrap: 'wrap', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                          <FileText size={14} color={colors.mutedText} />
                          <span style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', color: colors.mutedText }}>
                            {quiz.total_questions} questions
                          </span>
                        </div>
                        {/* quiz time limit removed from list view */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                          <Award size={14} color={colors.mutedText} />
                          <span style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', color: colors.mutedText }}>
                            {quiz.passing_score}% to pass
                          </span>
                        </div>
                        {/* Show student's attempts and score if available */}
                        {studentQuizData && studentQuizData.attempts > 0 && (
                          <>
                            <div style={{
                              fontSize: '0.85rem',
                              padding: `${spacing.xs}px ${spacing.sm}px`,
                              background: `${module.color}15`,
                              color: module.color,
                              borderRadius: borderRadius.sm,
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing.xs
                            }}>
                              <span>Attempts: {studentQuizData.attempts}</span>
                            </div>
                            <div style={{
                              fontSize: '0.85rem',
                              padding: `${spacing.xs}px ${spacing.sm}px`,
                              background: studentQuizData.best_score >= quiz.passing_score 
                                ? `${colors.success}20` 
                                : `${colors.warning}20`,
                              color: studentQuizData.best_score >= quiz.passing_score 
                                ? colors.success 
                                : colors.warning,
                              borderRadius: borderRadius.sm,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: spacing.xs
                            }}>
                              <Award size={14} />
                              <span>Highest: {studentQuizData.best_score}%</span>
                            </div>
                          </>
                        )}
                        {!studentQuizData || studentQuizData.attempts === 0 ? (
                          <div style={{
                            fontSize: '0.8rem',
                            padding: `${spacing.xs}px ${spacing.sm}px`,
                            background: quiz.is_active ? `${colors.success}20` : `${colors.mutedText}20`,
                            color: quiz.is_active ? colors.success : colors.mutedText,
                            borderRadius: borderRadius.sm,
                            fontWeight: 600
                          }}>
                            {quiz.is_active ? 'Active' : 'Inactive'}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {(userRole === 'admin' || userRole === 'teacher') && (
                      <div style={{ display: 'flex', gap: spacing.sm, marginLeft: spacing.md }}>
                        <button
                          style={{
                            padding: spacing.sm,
                            borderRadius: borderRadius.sm,
                            border: 'none',
                            background: colors.cardBg,
                            color: module.color || colors.mutedText,
                            cursor: 'pointer',
                            transition: 'all 0.12s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditQuiz(quiz);
                          }}
                          onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                              onMouseLeave={e => { e.currentTarget.style.background = colors.cardBg; e.currentTarget.style.transform = 'translateY(0)'; }}
                          title="Edit Quiz"
                        >
                          <Edit3 size={14} color={colors.success} />
                        </button>
                        <button
                          style={{
                            padding: spacing.sm,
                            borderRadius: borderRadius.sm,
                            border: 'none',
                            background: colors.cardBg,
                            color: module.color || colors.mutedText,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteQuiz(quiz, module.id);
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = colors.cardBg; e.currentTarget.style.transform = 'translateY(0)'; }}
                          title="Delete Quiz"
                        >
                          <Trash2 size={14} color={colors.danger} />
                        </button>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <React.Fragment>
      <style>
        {`
          /* Animations removed per user request */
        `}
      </style>
      
      <div style={{ 
        minHeight: '100vh',
        background: colors.mainBg,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        {/* SideMenu Component - hidden on mobile */}
        {!isMobile && <SideMenu selectedItem="Modules" />}

        {/* Enhanced Sidebar - collapses on mobile */}
        <div style={{ 
          width: isMobile ? '100%' : 280,
          background: colors.contentBg,
          padding: isMobile ? spacing.md : spacing.lg,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: shadows.lg,
          marginLeft: isMobile ? 0 : 236, // Adjust for SideMenu width
          position: 'relative'
        }}>
          <button 
            style={{ 
              alignSelf: 'flex-start', 
              marginBottom: spacing.lg, 
              background: colors.cardBg, 
              border: 'none', 
              color: colors.textColor, 
              fontWeight: 600, 
              fontSize: '1rem', 
              cursor: 'pointer',
              padding: `${spacing.sm}px ${spacing.md}px`,
              borderRadius: borderRadius.md,
              display: 'flex',
              alignItems: 'center',
              gap: spacing.sm,
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(255,255,255,0.3)';
              e.target.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={e => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.transform = 'translateX(0px)';
            }}
            onClick={() => navigate('/modules')}
          >
            <ArrowLeft size={18} />
            All Subjects
          </button>

          <div style={{ 
            textAlign: 'center',
            marginBottom: spacing.xl
          }}>
            <div style={{ 
              width: 120, 
              height: 120, 
              background: colors.cardBg,
              borderRadius: borderRadius.xl,
              margin: '0 auto',
              marginBottom: spacing.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)'
            }}>
              <img
                src={subjectImages[subjectName] || languageImg}
                alt={subjectName}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: borderRadius.xl }}
              />
            </div>
            <h1 style={{ 
              fontWeight: 700, 
              fontSize: '1.5rem', 
              margin: 0,
              color: colors.textColor,
              textShadow: 'none'
            }}>
              {subjectName}
            </h1>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {/* Sidebar navigation items */}
            <button
              style={{
                padding: `${spacing.md}px ${spacing.lg}px`,
                borderRadius: borderRadius.md,
                border: 'none',
                background: activeTab === 'Modules' ? colors.cardBg : 'transparent',
                color: colors.textColor,
                fontWeight: activeTab === 'Modules' ? 600 : 500,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onClick={() => handleSidebarNav('Modules')}
            >
              <BookOpen size={20} color={colors.textColor} /> Modules
            </button>
            {/* Lessons tab removed. Lessons will be shown inside modules. */}
            <button
              style={{
                padding: `${spacing.md}px ${spacing.lg}px`,
                borderRadius: borderRadius.md,
                border: 'none',
                background: activeTab === 'Progress' ? colors.cardBg : 'transparent',
                color: colors.textColor,
                fontWeight: activeTab === 'Progress' ? 600 : 500,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: spacing.md,
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onClick={() => handleSidebarNav('Progress')}
            >
              <TrendingUp size={20} color={colors.textColor} /> Progress
            </button>
            {/* HIDDEN: Grades button - keeping code for future use */}
            <button
              style={{
                padding: `${spacing.md}px ${spacing.lg}px`,
                borderRadius: borderRadius.md,
                border: 'none',
                background: activeTab === 'Grades' ? colors.cardBg : 'transparent',
                color: colors.textColor,
                fontWeight: activeTab === 'Grades' ? 600 : 500,
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'none', // HIDDEN: Changed from 'flex' to 'none'
                alignItems: 'center',
                gap: spacing.md,
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onClick={() => handleSidebarNav('Grades')}
            >
              <Award size={20} color={colors.textColor} /> Grades
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{
          flex: 1,
          padding: spacing.xl,
          overflow: 'auto',
          marginLeft: 0
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? spacing.md : 0,
              marginBottom: spacing['2xl'],
              background: colors.contentBg,
              padding: isMobile ? spacing.md : spacing.lg,
              borderRadius: borderRadius.xl,
              boxShadow: shadows.md
            }}>
              <div>
                <h1 style={{
                  fontWeight: 700,
                  fontSize: isMobile ? '1.25rem' : '2rem',
                  margin: 0,
                  color: colors.textColor,
                  marginBottom: spacing.xs
                }}>
                  {activeTab === 'Modules' ? 'Course Modules' : activeTab === 'Progress' ? 'Progress' : activeTab === 'Grades' ? 'Grades' : 'Lessons'}
                </h1>
                {activeTab === 'Progress' && String(userRole).toLowerCase() === 'teacher' && (
                  <p style={{ 
                    color: colors.mutedText, 
                    fontSize: '1rem', 
                    margin: 0,
                    fontWeight: 500 
                  }}>
                    {teacherSection ? (
                      <>
                        Viewing progress for section: <span style={{ color: colors.primary, fontWeight: 600 }}>{teacherSection.name}</span>
                        {studentsToShow.length > 0 && (
                          <span style={{ marginLeft: spacing.sm }}>
                            ({studentsToShow.length} student{studentsToShow.length !== 1 ? 's' : ''})
                          </span>
                        )}
                      </>
                    ) : studentsLoading ? (
                      'Loading section information...'
                    ) : realStudents.length > 0 ? (
                      <span style={{ color: colors.warning }}>
                        Showing all students (no section assigned) - 
                        <span style={{ marginLeft: spacing.sm }}>
                          ({realStudents.length} student{realStudents.length !== 1 ? 's' : ''})
                        </span>
                      </span>
                    ) : (
                      <span style={{ color: colors.danger }}>No section assigned - contact administrator</span>
                    )}
                  </p>
                )}
              </div>
              {activeTab === 'Modules' && userRole === 'teacher' && (
                <button
                  style={{
                    padding: `${spacing.md}px ${spacing.xl}px`,
                    borderRadius: borderRadius.lg,
                    border: `2px solid ${subjectColor}`,
                    background: subjectColor,
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setShowModuleModal(true)}
                  onMouseEnter={e => {
                    const hoverColor = darken(subjectColor, 12);
                    e.target.style.background = hoverColor;
                    e.target.style.borderColor = hoverColor;
                    e.target.style.color = '#fff';
                  }}
                  onMouseLeave={e => {
                    e.target.style.background = subjectColor;
                    e.target.style.borderColor = subjectColor;
                    e.target.style.color = '#fff';
                  }}
                >
                  <Plus size={20} style={{ marginRight: spacing.xs }} />
                  Create Module
                </button>
              )}
              {/* Create Lesson button removed. Add lesson logic can be added inside module card if needed. */}
            </div>
            
            {/* Main content swap */}
            {activeTab === 'Modules' ? (
              <React.Fragment>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {loading ? (
                    <div style={{
                      textAlign: 'center',
                      padding: spacing['2xl'],
                      background: colors.contentBg,
                      borderRadius: borderRadius.xl,
                      boxShadow: shadows.md
                    }}>
                      <div style={{ 
                        width: '50px', 
                        height: '50px', 
                        border: `4px solid ${colors.primary}20`,
                        borderTop: `4px solid ${colors.primary}`,
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 20px'
                      }}></div>
                      <p style={{ color: colors.mutedText, fontSize: '1.1rem' }}>Loading modules for {subjectName}...</p>
                    </div>
                  ) : error ? (
                    <div style={{
                      textAlign: 'center',
                      padding: spacing['2xl'],
                      background: colors.contentBg,
                      borderRadius: borderRadius.xl,
                      boxShadow: shadows.md
                    }}>
                      <div style={{ 
                        fontSize: '50px',
                        marginBottom: spacing.lg,
                        color: '#ef4444'
                      }}>⚠️</div>
                      <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        margin: 0,
                        marginBottom: spacing.sm,
                        color: '#ef4444'
                      }}>
                        Error Loading Modules
                      </h3>
                      <p style={{
                        fontSize: '1.1rem',
                        margin: 0,
                        color: colors.mutedText,
                        marginBottom: spacing.lg
                      }}>
                        {error}
                      </p>
                    </div>
                  ) : (
                    <>
                      {modules.map((module, idx) => (
                        <div key={module.id || module.name} style={{ marginBottom: spacing.lg }}>
                          <ModuleCard module={module} index={idx} />
                          {/* Student progression view moved to the Progress tab -- removed here */}
                        </div>
                      ))}
                      {modules.length === 0 && (
                    <div style={{
                      textAlign: 'center',
                      padding: spacing['2xl'],
                      background: colors.contentBg,
                      borderRadius: borderRadius.xl,
                      boxShadow: shadows.md
                    }}>
                      <BookOpen size={64} color={colors.lightText} style={{ marginBottom: spacing.lg }} />
                      <h3 style={{
                        fontSize: '1.5rem',
                        fontWeight: 600,
                        margin: 0,
                        marginBottom: spacing.sm,
                        color: colors.textColor
                      }}>
                        No modules yet
                      </h3>
                      <p style={{
                        fontSize: '1.1rem',
                        margin: 0,
                        color: colors.mutedText,
                        marginBottom: spacing.lg
                      }}>
                        Create your first module to start organizing your course content
                      </p>
                      {userRole === 'teacher' && (
                        <button
                          style={{
                            padding: `${spacing.md}px ${spacing.xl}px`,
                            borderRadius: borderRadius.lg,
                            border: `2px solid ${subjectColor}`,
                            background: subjectColor,
                            color: '#fff',
                            fontWeight: 600,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => setShowModuleModal(true)}
                          onMouseEnter={e => {
                            const hoverColor = darken(subjectColor, 12);
                            e.target.style.background = hoverColor;
                            e.target.style.borderColor = hoverColor;
                            e.target.style.color = '#fff';
                          }}
                          onMouseLeave={e => {
                            e.target.style.background = subjectColor;
                            e.target.style.borderColor = subjectColor;
                            e.target.style.color = '#fff';
                          }}
                        >
                          Get Started
                        </button>
                      )}
                    </div>
                  )}
                    </>
                  )}
                </div>
                {showModuleModal && (
                  <CreateModuleModal 
                    colors={colors}
                    spacing={spacing}
                    borderRadius={borderRadius}
                    handleClose={() => {
                      setShowModuleModal(false);
                      resetModuleForm();
                    }}
                    handleCreateModule={handleCreateModule}
                    newModuleName={newModuleName}
                    setNewModuleName={setNewModuleName}
                    newModuleDescription={newModuleDescription}
                    setNewModuleDescription={setNewModuleDescription}
                    newModuleDifficulty={newModuleDifficulty}
                    setNewModuleDifficulty={setNewModuleDifficulty}
                    newModuleDuration={newModuleDuration}
                    setNewModuleDuration={setNewModuleDuration}
                    newModuleObjectives={newModuleObjectives}
                    setNewModuleObjectives={setNewModuleObjectives}
                    userRole={userRole}
                    subjectColor={subjectColor}
                  />
                )}
                {showLessonModal && (
  <CreateLessonModal
    showLessonModal={showLessonModal}
    setShowLessonModal={setShowLessonModal}
    newLessonTitle={newLessonTitle}
    setNewLessonTitle={setNewLessonTitle}
    newLessonDescription={newLessonDescription}
    setNewLessonDescription={setNewLessonDescription}
    newLessonContent={newLessonContent}
    setNewLessonContent={setNewLessonContent}
    handleSubmitLesson={handleSubmitLesson}
    resetLessonForm={resetLessonForm}
    moduleColor={subjectColor}
  />
)}
               {showQuizModal && (
  <CreateQuizModal
    showQuizModal={showQuizModal}
    setShowQuizModal={setShowQuizModal}
    newQuizTitle={newQuizTitle}
    setNewQuizTitle={setNewQuizTitle}
    newQuizDescription={newQuizDescription}
    setNewQuizDescription={setNewQuizDescription}
  newQuizQuestionCount={newQuizQuestionCount}
  setNewQuizQuestionCount={setNewQuizQuestionCount}
  newQuizPassingScore={newQuizPassingScore}
    setNewQuizPassingScore={setNewQuizPassingScore}
    moduleColor={subjectColor}
    quizQuestions={quizQuestions}
    setQuizQuestions={setQuizQuestions}
    handleSubmitQuiz={handleSubmitQuiz}
    resetQuizForm={resetQuizForm}
    addQuestion={addQuestion}
    removeQuestion={removeQuestion}
    updateQuestion={updateQuestion}
    updateQuestionOption={updateQuestionOption}
    setCorrectAnswer={setCorrectAnswer}
    handleQuestionImageUpload={handleQuestionImageUpload}
    removeQuestionImage={removeQuestionImage}
    lessons={modules.find(m => m.id === currentModuleId)?.lessons || []}
    selectedLessonId={currentLessonId}
    setSelectedLessonId={setCurrentLessonId}
  />
)}
                {/* Custom Delete Confirmation Modal */}
                {showDeleteConfirmation && (
                  <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1070 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.48)' }} onClick={() => { setShowDeleteConfirmation(false); setModuleToDelete(null); }} />
                    <div role="dialog" aria-modal="true" style={{ position: 'relative', width: 520, maxWidth: '92%', background: colors.contentBg, color: colors.textColor, borderRadius: borderRadius.lg, padding: '22px 26px', boxShadow: shadows.xl, border: `1px solid ${colors.borderColor}` }}>
                      <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: '1.05rem', color: colors.textColor }}>Are you sure you want to delete the module "{moduleToDelete?.name}"?</h3>
                      <div style={{ color: colors.mutedText, marginBottom: 18, lineHeight: 1.5 }}>
                        <p style={{ margin: '6px 0' }}>This will permanently delete:</p>
                        <ul style={{ marginTop: 8, marginBottom: 8, paddingLeft: 18 }}>
                          <li style={{ marginBottom: 6 }}>The module</li>
                          <li style={{ marginBottom: 6 }}>All its lessons</li>
                          <li style={{ marginBottom: 6 }}>All its quizzes</li>
                        </ul>
                        <p style={{ marginTop: 8, color: colors.mutedText }}>This action cannot be undone.</p>
                      </div>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button onClick={() => { setShowDeleteConfirmation(false); setModuleToDelete(null); }} style={{ padding: '10px 18px', borderRadius: borderRadius.xl, background: colors.mainBg, border: `1px solid ${colors.borderColor}`, color: colors.textColor, cursor: 'pointer' }} onMouseEnter={e=>e.currentTarget.style.background=colors.cardBg} onMouseLeave={e=>e.currentTarget.style.background=colors.mainBg}>Cancel</button>
                        <button onClick={() => performDeleteModule(moduleToDelete)} style={{ padding: '10px 20px', borderRadius: borderRadius.xl, background: colors.danger, border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 8px 20px rgba(239,68,68,0.18)' }} onMouseEnter={e=>e.currentTarget.style.background=darken(colors.danger,6)} onMouseLeave={e=>e.currentTarget.style.background=colors.danger}>OK</button>
                      </div>
                    </div>
                  </div>
                )}
                {showLessonDeleteConfirmation && (
                  <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1070 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.48)' }} onClick={() => { setShowLessonDeleteConfirmation(false); setLessonToDelete(null); setLessonModuleIdToDelete(null); }} />
                    <div role="dialog" aria-modal="true" style={{ position: 'relative', width: 520, maxWidth: '92%', background: colors.contentBg, color: colors.textColor, borderRadius: borderRadius.lg, padding: '22px 26px', boxShadow: shadows.xl, border: `1px solid ${colors.borderColor}` }}>
                      <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: '1.05rem', color: colors.textColor }}>Are you sure you want to delete the lesson "{lessonToDelete?.title}"?</h3>
                      <div style={{ color: colors.mutedText, marginBottom: 18, lineHeight: 1.5 }}>
                        <p style={{ margin: '6px 0' }}>This will permanently delete this lesson and its associated content (quizzes, resources).</p>
                        <p style={{ marginTop: 8, color: colors.mutedText }}>This action cannot be undone.</p>
                      </div>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button onClick={() => { setShowLessonDeleteConfirmation(false); setLessonToDelete(null); setLessonModuleIdToDelete(null); }} style={{ padding: '10px 18px', borderRadius: borderRadius.xl, background: colors.mainBg, border: `1px solid ${colors.borderColor}`, color: colors.textColor, cursor: 'pointer' }} onMouseEnter={e=>e.currentTarget.style.background=colors.cardBg} onMouseLeave={e=>e.currentTarget.style.background=colors.mainBg}>Cancel</button>
                        <button onClick={performDeleteLesson} style={{ padding: '10px 20px', borderRadius: borderRadius.xl, background: colors.danger, border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 8px 20px rgba(239,68,68,0.18)' }} onMouseEnter={e=>e.currentTarget.style.background=darken(colors.danger,6)} onMouseLeave={e=>e.currentTarget.style.background=colors.danger}>Delete</button>
                      </div>
                    </div>
                  </div>
                )}
                {showQuizDeleteConfirmation && (
                  <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1070 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.48)' }} onClick={() => { setShowQuizDeleteConfirmation(false); setQuizToDelete(null); setQuizModuleIdToDelete(null); }} />
                    <div role="dialog" aria-modal="true" style={{ position: 'relative', width: 520, maxWidth: '92%', background: colors.contentBg, color: colors.textColor, borderRadius: borderRadius.lg, padding: '22px 26px', boxShadow: shadows.xl, border: `1px solid ${colors.borderColor}` }}>
                      <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: '1.05rem', color: colors.textColor }}>Are you sure you want to delete the quiz "{quizToDelete?.title}"?</h3>
                      <div style={{ color: colors.mutedText, marginBottom: 18, lineHeight: 1.5 }}>
                        <p style={{ margin: '6px 0' }}>This will permanently delete this quiz and its associated questions and attempts.</p>
                        <p style={{ marginTop: 8, color: colors.mutedText }}>This action cannot be undone.</p>
                      </div>
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                        <button onClick={() => { setShowQuizDeleteConfirmation(false); setQuizToDelete(null); setQuizModuleIdToDelete(null); }} style={{ padding: '10px 18px', borderRadius: borderRadius.xl, background: colors.mainBg, border: `1px solid ${colors.borderColor}`, color: colors.textColor, cursor: 'pointer' }} onMouseEnter={e=>e.currentTarget.style.background=colors.cardBg} onMouseLeave={e=>e.currentTarget.style.background=colors.mainBg}>Cancel</button>
                        <button onClick={performDeleteQuiz} style={{ padding: '10px 20px', borderRadius: borderRadius.xl, background: colors.danger, border: 'none', color: '#fff', cursor: 'pointer', boxShadow: '0 8px 20px rgba(239,68,68,0.18)' }} onMouseEnter={e=>e.currentTarget.style.background=darken(colors.danger,6)} onMouseLeave={e=>e.currentTarget.style.background=colors.danger}>Delete</button>
                      </div>
                    </div>
                  </div>
                )}
                {showEditModuleModal && <EditModuleModal />}
                {showEditLessonModal && <EditLessonModal />}
                {showEditQuizModal && <EditQuizModal />}
                {showLessonDetailModal && <LessonDetailModal />}
                {showQuizDetailModal && <QuizDetailModal />}
                {/* Toast for successful module creation (center top) */}
                <div style={{ position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', zIndex: 1060, pointerEvents: 'none' }} aria-live="polite">
                  <div style={{ minWidth: 320, pointerEvents: 'auto' }}>
                    <Toast onClose={() => setShowModuleCreatedToast(false)} show={showModuleCreatedToast} delay={3000} autohide style={{ borderRadius: borderRadius.md, boxShadow: shadows.xl, overflow: 'hidden', background: colors.contentBg, border: `1px solid ${colors.borderColor}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', color: colors.textColor }}>
                        {/* icon circle varies by toast type */}
                        <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: moduleToastType === 'created' ? colors.success : moduleToastType === 'updated' ? colors.info : colors.danger }}>
                          {moduleToastType === 'deleted' ? <Trash2 color="#fff" size={18} /> : moduleToastType === 'updated' ? <Edit3 color="#fff" size={18} /> : <Check color="#fff" size={18} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{moduleToastType === 'created' ? `${toastEntity} created` : moduleToastType === 'updated' ? `${toastEntity} updated` : `${toastEntity} deleted`}</div>
                          <div style={{ fontSize: 13, color: colors.mutedText }}>{moduleCreatedName || (moduleToastType === 'created' ? 'Successfully created' : moduleToastType === 'updated' ? 'Successfully updated' : 'Successfully deleted')}</div>
                        </div>
                        <button onClick={() => setShowModuleCreatedToast(false)} style={{ background: 'transparent', border: 'none', color: colors.mutedText, cursor: 'pointer' }} aria-label="Close">
                          ✕
                        </button>
                      </div>
                    </Toast>
                  </div>
                </div>
              </React.Fragment>
            )
            : activeTab === 'Lessons' ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Example lessons data */}
                {[{
                  title: 'Introduction to Language',
                  description: 'Learn the basics of language and communication.',
                  quizzes: 2,
                  color: subjectColor
                }, {
                  title: 'Grammar Essentials',
                  description: 'Understand grammar rules and sentence structure.',
                  quizzes: 1,
                  color: subjectColor
                }, {
                  title: 'Vocabulary Building',
                  description: 'Expand your vocabulary with fun exercises.',
                  quizzes: 0,
                  color: subjectColor
                }].map((lesson, idx) => (
                  <div key={lesson.title} style={{
                    background: colors.contentBg,
                    border: `2px solid ${lesson.color}`,
                    borderRadius: borderRadius.lg,
                    marginBottom: spacing.lg,
                    boxShadow: shadows.md,
                    transition: 'all 0.3s ease',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    padding: spacing.lg
                  }}>
                    <div style={{ width: 6, height: 40, background: lesson.color, borderRadius: borderRadius.sm, marginRight: spacing.md }} />
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontWeight: 700, fontSize: '1.25rem', margin: 0, color: colors.textColor }}>{lesson.title}</h3>
                      <p style={{ color: colors.mutedText, margin: 0, marginTop: 4 }}>{lesson.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs, marginTop: 8 }}>
                        <FileText size={16} color={colors.mutedText} />
                        <span style={{ fontSize: '0.9rem', color: colors.mutedText }}>{lesson.quizzes} quiz{lesson.quizzes !== 1 ? 'zes' : ''}</span>
                      </div>
                    </div>
                    {userRole !== 'student' && (
                      <button style={{
                        padding: `${spacing.sm}px ${spacing.md}px`,
                        borderRadius: borderRadius.md,
                        border: `2px solid ${colors.secondary}`,
                        background: colors.secondary,
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        marginLeft: spacing.lg,
                        transition: 'all 0.2s ease'
                      }}>
                        <Plus size={16} style={{ marginRight: spacing.xs }} /> Add Quiz
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )
            : activeTab === 'Progress' ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {loading || studentsLoading ? (
                  <div style={{ textAlign: 'center', padding: spacing['2xl'], background: colors.contentBg, borderRadius: borderRadius.xl, boxShadow: shadows.md }}>
                    <div style={{ width: '50px', height: '50px', border: `4px solid ${colors.primary}20`, borderTop: `4px solid ${colors.primary}`, borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
                    <p style={{ color: colors.mutedText, fontSize: '1.1rem' }}>
                      {studentsLoading 
                        ? String(userRole).toLowerCase() === 'teacher' 
                          ? teacherSection 
                            ? `Loading students from section "${teacherSection.name}"...`
                            : 'Checking your section assignment...'
                          : 'Loading students...'
                        : `Loading progress for ${subjectName}...`}
                    </p>
                  </div>
                ) : (
                  modules.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: spacing['2xl'], background: colors.contentBg, borderRadius: borderRadius.xl, boxShadow: shadows.md }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: colors.textColor }}>No modules yet</h3>
                      <p style={{ color: colors.mutedText }}>There are no modules to display progress for.</p>
                    </div>
                  ) : studentsToShow.length === 0 && String(userRole).toLowerCase() === 'teacher' ? (
                    <div style={{ textAlign: 'center', padding: spacing['2xl'], background: colors.contentBg, borderRadius: borderRadius.xl, boxShadow: shadows.md }}>
                      <Users size={64} color={colors.lightText} style={{ marginBottom: spacing.lg }} />
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: colors.textColor }}>
                        {teacherSection ? 'No students in your section' : 'No section assigned'}
                      </h3>
                      <p style={{ color: colors.mutedText, marginBottom: spacing.md }}>
                        {teacherSection 
                          ? `There are no students assigned to your section "${teacherSection.name}" yet. Students may not have been enrolled in your section, or they may not be active.`
                          : 'You have not been assigned to a section yet. Please contact your administrator to get assigned to a classroom section.'
                        }
                      </p>
                      {!teacherSection && (
                        <div style={{ 
                          background: '#fef3c7', 
                          border: '1px solid #f59e0b', 
                          borderRadius: borderRadius.md, 
                          padding: spacing.md, 
                          maxWidth: '400px', 
                          margin: '0 auto',
                          textAlign: 'left'
                        }}>
                          <p style={{ color: '#92400e', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
                            <strong>What to do:</strong><br />
                            • Contact your school administrator<br />
                            • Ask to be assigned to a classroom section<br />
                            • Once assigned, you'll see your students' progress here
                          </p>
                        </div>
                      )}
                      {teacherSection && (
                        <div style={{ 
                          background: '#dbeafe', 
                          border: '1px solid #3b82f6', 
                          borderRadius: borderRadius.md, 
                          padding: spacing.md, 
                          maxWidth: '400px', 
                          margin: '0 auto',
                          textAlign: 'left'
                        }}>
                          <p style={{ color: '#1e40af', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
                            <strong>Section Info:</strong><br />
                            • Section: {teacherSection.name}<br />
                            • Classroom: {teacherSection.classroom_number || 'Not specified'}<br />
                            • Students will appear here once enrolled
                          </p>
                        </div>
                      )}
                    </div>
                  ) : studentsToShow.length === 0 && String(userRole).toLowerCase() === 'parent' ? (
                    <div style={{ textAlign: 'center', padding: spacing['2xl'], background: colors.contentBg, borderRadius: borderRadius.xl, boxShadow: shadows.md }}>
                      <Users size={64} color={colors.lightText} style={{ marginBottom: spacing.lg }} />
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: colors.textColor }}>
                        No child selected
                      </h3>
                      <p style={{ color: colors.mutedText }}>
                        Please select a child from your profile to view their progress.
                      </p>
                    </div>
                  ) : (
                        modules.map((m, idx) => {
                          // Calculate progress based on user role
                          let studentProgress = m.progress || 0;
                          
                          if (String(userRole).toLowerCase() === 'teacher') {
                            // For teachers, show class-wide completion percentage
                            if (studentsToShow.length > 0) {
                              let totalCompletion = 0;
                              let studentCount = 0;
                              
                              studentsToShow.forEach(student => {
                                const studentModuleProgress = student?.progress?.modules?.find(
                                  pm => String(pm.id) === String(m.id) || pm.title === m.name
                                );
                                if (studentModuleProgress) {
                                  totalCompletion += studentModuleProgress.completion || 0;
                                  studentCount++;
                                }
                              });
                              
                              studentProgress = studentCount > 0 ? Math.round(totalCompletion / studentCount) : 0;
                            }
                          } else if (studentsToShow.length > 0) {
                            // For parents/students, show individual student progress
                            const currentStudent = studentsToShow[0]; // Parent will only have one student
                            const studentModuleProgress = currentStudent?.progress?.modules?.find(
                              pm => String(pm.id) === String(m.id) || pm.title === m.name
                            );
                            if (studentModuleProgress) {
                              studentProgress = studentModuleProgress.completion || 0;
                            }
                          }
                          
                          return (
                        <div key={m.id || m.name || idx} style={{
                        background: colors.contentBg,
                        border: `2px solid ${m.color || subjectColor || colors.borderColor}`,
                        borderRadius: borderRadius.lg,
                        marginBottom: spacing.lg,
                        boxShadow: shadows.md,
                        transition: 'all 0.3s ease',
                        overflow: 'hidden'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', padding: isMobile ? spacing.md : spacing.lg, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? spacing.sm : 0 }}>
                          <div style={{ width: isMobile ? '100%' : 6, height: isMobile ? 8 : 40, background: m.color || colors.primary, borderRadius: borderRadius.sm, marginRight: isMobile ? 0 : spacing.md }} />
                          <div style={{ flex: 1, width: '100%' }}>
                            <h3 style={{ fontWeight: 700, fontSize: '1.25rem', margin: 0, color: colors.textColor }}>{m.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md, marginTop: 8 }}>
                              <div style={{ flex: 1, width: '100%' }}>
                                <div className="progress" style={{ height: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.04)' }}>
                                  <div className="progress-bar" role="progressbar" style={{ width: `${studentProgress}%`, background: m.color || colors.primary, height: '12px', borderRadius: '8px' }} aria-valuenow={studentProgress} aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                              </div>
                              {!isMobile && (
                                <div style={{ marginLeft: spacing.md, fontWeight: 700, color: m.color || colors.primary }}>{studentProgress}%</div>
                              )}
                            </div>
                          </div>
                          <div style={{ marginLeft: spacing.md }}>
                            <button onClick={() => toggleModule(idx)} style={{ padding: spacing.sm, borderRadius: borderRadius.sm, border: 'none', background: colors.cardBg, cursor: 'pointer' }} title="View students progress">
                              <span style={{ display: 'inline-flex', transform: m.expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><ChevronRight /></span>
                            </button>
                          </div>
                        </div>

                        {m.expanded && (
                          <div style={{ padding: `${spacing.sm} ${spacing.lg}`, borderTop: `1px solid ${colors.borderColor}`, background: colors.cardBg }}>
                            <div style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: spacing.sm,
                                  alignItems: 'stretch',
                                  maxHeight: 320,
                                  overflowY: 'auto',
                                  paddingBottom: spacing.xs,
                                  width: '100%'
                              }}>
                              {String(userRole).toLowerCase() === 'parent' ? (
                                <ProgressDetails
                                  moduleId={m.id}
                                  studentId={selectedChildId}
                                  userRole={userRole}
                                  showForAllStudents={false}
                                  colors={colors}
                                  spacing={spacing}
                                  borderRadius={borderRadius}
                                  shadows={shadows}
                                />
                              ) : String(userRole).toLowerCase() === 'teacher' ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, width: '100%' }}>
                                  {studentsToShow.map(student => {
                                    const modProg = student.progress.modules.find(pm => String(pm.id) === String(m.id) || pm.title === m.name) || { completion: 0, lessons_completed: 0, total_lessons: 0, quizzes: null };
                                    const isSelected = selectedStudent && String(selectedStudent.id) === String(student.id);
                                    const handleStudentClick = () => {
                                      const shouldSelect = !isSelected;
                                      setSelectedStudent(shouldSelect ? student : null);

                                      if (shouldSelect) {
                                        // Give time for the content to render before scrolling
                                        setTimeout(() => {
                                          const elementId = `progress-${m.id}-${student.id}`;
                                          const element = document.getElementById(elementId);
                                          if (!element) return;

                                          // Find nearest scrollable ancestor (module's student list)
                                          let scrollAncestor = element.parentElement;
                                          while (scrollAncestor) {
                                            const style = window.getComputedStyle(scrollAncestor);
                                            const overflowY = style.getPropertyValue('overflow-y');
                                            if (overflowY === 'auto' || overflowY === 'scroll') break;
                                            scrollAncestor = scrollAncestor.parentElement;
                                          }

                                          if (scrollAncestor) {
                                            // Calculate offset of element relative to ancestor and scroll
                                            const ancestorRect = scrollAncestor.getBoundingClientRect();
                                            const elementRect = element.getBoundingClientRect();
                                            const offset = elementRect.top - ancestorRect.top + scrollAncestor.scrollTop - 8; // small padding
                                            scrollAncestor.scrollTo({ top: offset, behavior: 'smooth' });
                                          } else {
                                            // Fallback to native scrollIntoView
                                            element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                                          }
                                        }, 120);
                                      }
                                    };

                                    return (
                                      <div key={student.id} style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
                                        <button
                                          type="button"
                                          onClick={handleStudentClick}
                                          style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            width: '100%',
                                            padding: spacing.sm,
                                            background: isSelected ? '#f6f9ff' : '#fff',
                                            border: `1px solid ${colors.borderColor}`,
                                            borderRadius: isSelected ? `${borderRadius.md} ${borderRadius.md} 0 0` : borderRadius.md,
                                            boxShadow: shadows.sm,
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            marginBottom: isSelected ? 0 : undefined
                                          }}
                                        >
                                          <div style={{ fontWeight: 700, color: colors.textColor }}>{student.name}</div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ color: m.color || colors.primary, fontWeight: 700 }}>{modProg.completion}%</div>
                                            <div style={{ transform: isSelected ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}><ChevronRight size={16} /></div>
                                          </div>
                                        </button>

                                        {isSelected && (
                                          <div 
                                            id={`progress-${m.id}-${student.id}`}
                                            style={{
                                              background: '#fff',
                                              border: `1px solid ${colors.borderColor}`,
                                            borderTop: 'none',
                                            borderRadius: `0 0 ${borderRadius.md} ${borderRadius.md}`,
                                            marginTop: -1
                                          }}>
                                            <ProgressDetails
                                              moduleId={m.id}
                                              studentId={student.id}
                                              userRole="parent"
                                              showForAllStudents={false}
                                              colors={colors}
                                              spacing={spacing}
                                              borderRadius={borderRadius}
                                              shadows={shadows}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, width: '100%' }}>
                                  {studentsToShow.map(student => {
                                    const modProg = student.progress.modules.find(pm => String(pm.id) === String(m.id) || pm.title === m.name) || { completion: 0, lessons_completed: 0, total_lessons: 0, quizzes: null };
                                    return (
                                      <div key={student.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <div style={{
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          width: '100%',
                                          padding: spacing.sm,
                                          background: '#fff',
                                          border: `1px solid ${colors.borderColor}`,
                                          borderRadius: borderRadius.md,
                                          boxShadow: shadows.sm
                                        }}>
                                          <div style={{ fontWeight: 700, color: colors.textColor }}>{student.name}</div>
                                          <div style={{ color: m.color || colors.primary, fontWeight: 700 }}>{modProg.completion}%</div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                          );
                        })
                  )
                )}
              </div>
            )
            : activeTab === 'Grades' ? (
              /* HIDDEN: Grades content - keeping code for future use */
              null
              /*
              <div style={{
                background: colors.cardBg,
                borderRadius: borderRadius.xl,
                boxShadow: shadows.md,
                padding: spacing.xl,
                minHeight: 300
              }}>
                <h2 style={{ fontWeight: 600, fontSize: '1.3rem', marginBottom: spacing.md }}>Grades</h2>
                <p style={{ color: colors.mutedText }}>This is where grades for {subjectName} will be displayed.</p>
              </div>
              */
            ) : null}
          </div>
        </div>
      </div>

      {/* Custom styles */}
      <style>
        {`
          @media (max-width: 991.98px) {
            .main-content {
              margin-left: 0 !important;
              width: 100% !important;
              padding-left: 20px !important;
              padding-top: 70px !important;
            }
          }
        `}
      </style>
    </React.Fragment>
  );
};

export default SubjectModulePage;
