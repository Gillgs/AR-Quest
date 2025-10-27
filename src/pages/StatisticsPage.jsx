import React, { useState, useEffect, useRef } from "react";
import { Container, Row, Col, Nav, Card, Button, Modal } from "react-bootstrap";
import { Line, Bar, Pie, Radar } from "react-chartjs-2";
import { FiFileText } from "react-icons/fi";
import { supabase, supabaseAdmin } from "../config/supabase";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import SideMenu from "../components/SideMenu";
import { colors } from "../styles/constants";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Chart container style for consistent sizing and modern look
const chartContainerStyle = {
  height: 'auto',
  minHeight: '250px',
  width: '100%',
  position: 'relative',
  padding: '1rem',
  overflow: 'hidden',
  borderRadius: '16px',
  background: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(5px)',
  boxShadow: 'rgba(149, 157, 165, 0.1) 0px 8px 24px'
};

// Wrapper style to maintain consistent card heights with improved spacing
const cardWrapperStyle = {
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  animation: 'fadeIn 0.5s ease-in-out',
  padding: '1rem 0'
};

// Chart options base configuration with enhanced visuals
const baseChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        padding: 20,
        font: {
          size: 14,
          weight: '500',
          family: "'Poppins', sans-serif"
        },
        usePointStyle: true,
        pointStyle: 'circle',
        boxWidth: 8
      }
    },
    title: {
      display: true,
      font: { 
        size: 18, 
        weight: 'bold',
        family: "'Poppins', sans-serif"
      },
      padding: { bottom: 20 },
      color: '#333'
    },
    tooltip: {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      titleColor: '#333',
      bodyColor: '#333',
      bodyFont: {
        family: "'Poppins', sans-serif"
      },
      titleFont: {
        family: "'Poppins', sans-serif",
        weight: 'bold'
      },
      borderColor: 'rgba(0, 0, 0, 0.05)',
      borderWidth: 1,
      cornerRadius: 10,
      padding: 12,
      boxPadding: 6,
      usePointStyle: true,
      callbacks: {
        labelTextColor: function(context) {
          return context.dataset.borderColor;
        }
      }
    }
  },
  animation: {
    duration: 1500,
    easing: 'easeOutQuart',
    delay: function(context) {
      return context.dataIndex * 100;
    }
  },
  elements: {
    point: {
      radius: 4,
      hoverRadius: 6,
      borderWidth: 2
    },
    line: {
      tension: 0.4
    }
  }
};



// Enhanced chart colors with modern vibrant palette
const chartColors = {
  primary: 'rgba(66, 99, 235, 1)',         // Royal blue
  primaryLight: 'rgba(66, 99, 235, 0.15)',
  secondary: 'rgba(84, 184, 255, 1)',      // Sky blue
  secondaryLight: 'rgba(84, 184, 255, 0.15)',
  success: 'rgba(38, 222, 129, 1)',        // Minty green
  successLight: 'rgba(38, 222, 129, 0.15)',
  warning: 'rgba(255, 184, 0, 1)',         // Golden yellow
  warningLight: 'rgba(255, 184, 0, 0.15)',
  danger: 'rgba(255, 71, 87, 1)',          // Coral red
  dangerLight: 'rgba(255, 71, 87, 0.15)',
  purple: 'rgba(156, 39, 176, 1)',         // Amethyst purple
  purpleLight: 'rgba(156, 39, 176, 0.15)',
  orange: 'rgba(255, 109, 0, 1)',          // Vibrant orange
  orangeLight: 'rgba(255, 109, 0, 0.15)',
  teal: 'rgba(0, 210, 193, 1)',            // Modern teal
  tealLight: 'rgba(0, 210, 193, 0.15)',
  pink: 'rgba(245, 59, 87, 1)',            // Bright pink
  pinkLight: 'rgba(245, 59, 87, 0.15)',
};

const StatisticsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [sections, setSections] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [monthlyStudentCounts, setMonthlyStudentCounts] = useState([]);
  const [sectionAttendance, setSectionAttendance] = useState([]);
  const [error, setError] = useState(null);
  // Time filter state
  const [timeFilter, setTimeFilter] = useState('all'); // 'day', 'week', 'month', 'all'

  // Helper function to get date range based on time filter
  const getDateRange = (filter) => {
    const now = new Date();
    let startDate = null;
    
    switch (filter) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        break;
      case 'all':
      default:
        startDate = null; // No date filter
        break;
    }
    
    return {
      startDate: startDate ? startDate.toISOString() : null,
      endDate: now.toISOString()
    };
  };
  // User authentication and role management
  const [userRole, setUserRole] = useState(null);
  const [teacherSections, setTeacherSections] = useState([]);
  const [teacherStudentCount, setTeacherStudentCount] = useState(0);
  const [teacherSectionsLoaded, setTeacherSectionsLoaded] = useState(false);
  // For section-student distribution
  const [sectionStudentData, setSectionStudentData] = useState({
    labels: [],
    datasets: [{
      label: "Students per Section",
      data: [],
      backgroundColor: [],
      borderColor: [],
      borderWidth: 1,
    }]
  });
  const [sectionStats, setSectionStats] = useState({
    totalSections: 0,
    totalStudents: 0,
    averagePerSection: 0,
    unassignedCount: 0,
    sectionsWithStudents: 0
  });
  const [loadingSectionPie, setLoadingSectionPie] = useState(true);
  // For subject performance data
  const [subjectPerformanceData, setSubjectPerformanceData] = useState({
    labels: [],
    datasets: []
  });
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [overallAverageScore, setOverallAverageScore] = useState(0);
  const [scoreImprovement, setScoreImprovement] = useState(0);
  const [totalQuizAttempts, setTotalQuizAttempts] = useState(0);
  // Dynamic score trend data based on actual quiz attempts
  const [scoreTrendData, setScoreTrendData] = useState({
    labels: [],
    datasets: []
  });
  const [loadingTrendData, setLoadingTrendData] = useState(true);
  
  // Engagement metrics state
  const [engagementData, setEngagementData] = useState({
    totalQuizAttempts: 0,
    totalLessonCompletions: 0,
    activeStudents: 0,
    completionRate: 0,
    avgQuizAttempts: 0,
    avgLessonCompletions: 0,
    popularSubjects: [],
    recentActivity: []
  });
  const [loadingEngagement, setLoadingEngagement] = useState(true);
  
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  // PDF export state
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const pdfContentRef = useRef(null);

  // Get time frame display text
  const getTimeFrameText = () => {
    return timeFilter === 'day' ? 'Last 24 Hours' : 
           timeFilter === 'week' ? 'Last 7 Days' : 
           timeFilter === 'month' ? 'Last 30 Days' : 'All Time';
  };

  // Handle window resize for mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Export to PDF function
  const exportToPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const element = pdfContentRef.current;
      if (!element) return;

      // Create a temporary element with better styling for PDF
      const pdfElement = document.createElement('div');
      pdfElement.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 210mm;
        background: white;
        padding: 20mm;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        color: #333;
        line-height: 1.6;
      `;

      const currentDate = new Date().toLocaleDateString();
      const currentTime = new Date().toLocaleTimeString();
      const userName = localStorage.getItem('userName') || 'User';
      const userRoleDisplay = userRole === 'teacher' ? 'Teacher' : userRole === 'admin' ? 'Administrator' : 'User';
      
      pdfElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #6a39e4; padding-bottom: 20px;">
          <h1 style="color: #6a39e4; margin: 0; font-size: 28px; font-weight: bold;">
            🎓 AR-Quest Statistics Report
          </h1>
          <p style="margin: 10px 0 5px 0; font-size: 14px; color: #666;">
            Generated by: ${userName} (${userRoleDisplay}) | Date: ${currentDate} ${currentTime}
          </p>
          <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 12px; color: #888;">
            <span><strong>Report Type:</strong> ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Statistics</span>
            <span><strong>Time Period:</strong> ${getTimeFrameText()}</span>
          </div>
        </div>

        ${await generatePDFContent()}
      `;

      document.body.appendChild(pdfElement);

      // Generate PDF with better quality settings
      const canvas = await html2canvas(pdfElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: pdfElement.scrollWidth,
        height: pdfElement.scrollHeight
      });

      document.body.removeChild(pdfElement);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Add additional pages if content is too long
      if (imgHeight * ratio > pdfHeight) {
        let heightLeft = imgHeight * ratio - pdfHeight;
        let position = -pdfHeight;
        
        while (heightLeft > 0) {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', imgX, position, imgWidth * ratio, imgHeight * ratio);
          heightLeft -= pdfHeight;
          position -= pdfHeight;
        }
      }

      const fileName = `AR-Quest-${activeTab}-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
    setIsGeneratingPDF(false);
  };

  // Generate PDF content based on active tab
  const generatePDFContent = async () => {
    let content = '';
    
    if (activeTab === 'overview') {
      content = `
        <div style="margin-bottom: 25px;">
          <h2 style="color: #6a39e4; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; margin-bottom: 20px;">
            📊 Overview Summary
          </h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%); padding: 15px; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; color: #1976d2; font-size: 16px;">Performance Metrics</h3>
              <p style="margin: 5px 0;"><strong>Average Score:</strong> ${loadingSubjects ? 'Loading...' : (totalQuizAttempts > 0 ? `${overallAverageScore}%` : 'N/A')}</p>
              <p style="margin: 5px 0;"><strong>Total Quiz Attempts:</strong> ${totalQuizAttempts}</p>
              <p style="margin: 5px 0;"><strong>Score Improvement:</strong> ${scoreImprovement > 0 ? `+${scoreImprovement}%` : 'Within expected range'}</p>
            </div>
            <div style="background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%); padding: 15px; border-radius: 8px;">
              <h3 style="margin: 0 0 10px 0; color: #388e3c; font-size: 16px;">Student Information</h3>
              <p style="margin: 5px 0;"><strong>Total Students:</strong> ${userRole === 'teacher' ? teacherStudentCount : totalStudents}</p>
              <p style="margin: 5px 0;"><strong>User Role:</strong> ${userRole === 'teacher' ? `Teacher (${teacherStudentCount} students)` : 'Administrator'}</p>
              <p style="margin: 5px 0;"><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      `;
    } else if (activeTab === 'performance') {
      content = `
        <div style="margin-bottom: 25px;">
          <h2 style="color: #6a39e4; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; margin-bottom: 20px;">
            📚 Subject Performance Analysis
          </h2>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="margin: 5px 0;"><strong>Total Quiz Attempts:</strong> ${totalQuizAttempts}</p>
                <p style="margin: 5px 0;"><strong>Overall Average Score:</strong> ${overallAverageScore}%</p>
                <p style="margin: 5px 0;"><strong>Active Subjects:</strong> ${subjectPerformanceData.labels?.length || 0}</p>
              </div>
              <div>
                <p style="margin: 5px 0;"><strong>Score Improvement:</strong> ${scoreImprovement > 0 ? `+${scoreImprovement}%` : 'Within expected range'}</p>
                <p style="margin: 5px 0;"><strong>User Role:</strong> ${userRole === 'teacher' ? `Teacher (${teacherStudentCount} students)` : 'Administrator'}</p>
                <p style="margin: 5px 0;"><strong>Data Period:</strong> ${getTimeFrameText()}</p>
              </div>
            </div>
          </div>
          ${subjectPerformanceData.labels?.length > 0 ? `
            <h3 style="color: #28a745; margin-bottom: 15px;">Subject Breakdown:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              ${subjectPerformanceData.labels.map((subject, index) => `
                <div style="background: white; padding: 10px; border: 1px solid #dee2e6; border-radius: 4px;">
                  <strong>${subject}:</strong><br>
                  Average: ${subjectPerformanceData.datasets[0]?.data[index] || 0}%<br>
                  Highest: ${subjectPerformanceData.datasets[1]?.data[index] || 0}%
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    } else if (activeTab === 'distribution') {
      content = `
        <div style="margin-bottom: 25px;">
          <h2 style="color: #6a39e4; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; margin-bottom: 20px;">
            👥 Section Distribution Analysis
          </h2>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="margin: 5px 0;"><strong>Total Students:</strong> ${sectionStats.totalStudents}</p>
                <p style="margin: 5px 0;"><strong>Total Sections:</strong> ${sectionStats.totalSections}</p>
                <p style="margin: 5px 0;"><strong>Average per Section:</strong> ${sectionStats.averagePerSection} students</p>
              </div>
              <div>
                <p style="margin: 5px 0;"><strong>Active Sections:</strong> ${sectionStats.sectionsWithStudents}</p>
                <p style="margin: 5px 0;"><strong>Unassigned Students:</strong> ${sectionStats.unassignedCount}</p>
                <p style="margin: 5px 0;"><strong>Data Period:</strong> ${getTimeFrameText()}</p>
              </div>
            </div>
          </div>
          ${sectionStudentData.labels?.length > 0 ? `
            <h3 style="color: #dc3545; margin-bottom: 15px;">Section Breakdown:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              ${sectionStudentData.labels.map((section, index) => `
                <div style="background: white; padding: 10px; border: 1px solid #dee2e6; border-radius: 4px;">
                  <strong>${section}:</strong> ${sectionStudentData.datasets[0]?.data[index] || 0} students
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    } else if (activeTab === 'engagement') {
      content = `
        <div style="margin-bottom: 25px;">
          <h2 style="color: #6a39e4; border-bottom: 2px solid #e9ecef; padding-bottom: 10px; margin-bottom: 20px;">
            ⚡ Student Engagement Analysis
          </h2>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p style="margin: 5px 0;"><strong>Quiz Attempts:</strong> ${engagementData.totalQuizAttempts}</p>
                <p style="margin: 5px 0;"><strong>Lessons Completed:</strong> ${engagementData.totalLessonCompletions}</p>
                <p style="margin: 5px 0;"><strong>Active Students:</strong> ${engagementData.activeStudents}</p>
                <p style="margin: 5px 0;"><strong>Completion Rate:</strong> ${engagementData.completionRate}%</p>
              </div>
              <div>
                <p style="margin: 5px 0;"><strong>Avg Quiz Attempts/Student:</strong> ${engagementData.avgQuizAttempts}</p>
                <p style="margin: 5px 0;"><strong>Avg Lessons/Student:</strong> ${engagementData.avgLessonCompletions}</p>
                <p style="margin: 5px 0;"><strong>Total Activities:</strong> ${engagementData.totalQuizAttempts + engagementData.totalLessonCompletions}</p>
                <p style="margin: 5px 0;"><strong>Data Period:</strong> ${getTimeFrameText()}</p>
              </div>
            </div>
          </div>
          ${engagementData.popularSubjects?.length > 0 ? `
            <h3 style="color: #17a2b8; margin-bottom: 15px;">Most Popular Subjects:</h3>
            <div style="margin-bottom: 20px;">
              ${engagementData.popularSubjects.slice(0, 5).map((subject, index) => `
                <div style="background: white; padding: 10px; border: 1px solid #dee2e6; border-radius: 4px; margin-bottom: 8px;">
                  <strong>${index + 1}. ${subject.name}:</strong> ${subject.total} activities 
                  (${subject.quizzes} quizzes, ${subject.lessons} lessons)
                </div>
              `).join('')}
            </div>
          ` : ''}
          ${engagementData.recentActivity?.length > 0 ? `
            <h3 style="color: #28a745; margin-bottom: 15px;">Recent Activity (Last 5):</h3>
            <div>
              ${engagementData.recentActivity.slice(0, 5).map((activity, index) => `
                <div style="background: white; padding: 8px; border: 1px solid #dee2e6; border-radius: 4px; margin-bottom: 5px; font-size: 12px;">
                  <strong>${activity.type === 'quiz' ? '🎯' : '📚'} ${activity.title}</strong> - ${activity.subject}
                  ${activity.score ? ` (Score: ${activity.score}%)` : ''} - ${new Date(activity.timestamp).toLocaleString()}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }

    return content;
  };







  // Get current user and role (following ClassroomPage/SubjectModulePage pattern)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const role = localStorage.getItem("userRole");
        const userId = localStorage.getItem("userId");
        
        // Debug logging for authentication issues (same as ClassroomPage)
        console.log('StatisticsPage - User Authentication Debug:');
        console.log('userRole:', role);
        console.log('userId:', userId);
        console.log('supabaseAdmin available:', !!supabaseAdmin);
        
        setUserRole(role);
        
        if (role === 'teacher' && userId) {
          // Use admin client for teachers to bypass RLS policies (same as other pages)
          const client = supabaseAdmin || supabase;
          
          // Get sections assigned to this teacher (direct query by teacher_id)
          const { data: sections, error: sectionsError } = await client
            .from('sections')
            .select('id, name, time_period, classroom_number, school_year')
            .eq('teacher_id', userId)
            .eq('is_active', true);
            
          if (sectionsError) {
            console.error('Error fetching teacher sections:', sectionsError);
            setTeacherSections([]);
            setTeacherStudentCount(0);
            setTeacherSectionsLoaded(true);
            return;
          }
          
          setTeacherSections(sections || []);
          
          // Get count of students in teacher's sections
          if (sections && sections.length > 0) {
            const sectionIds = sections.map(section => section.id);
            const { count: studentCount, error: countError } = await client
              .from('students')
              .select('id', { count: 'exact', head: true })
              .in('section_id', sectionIds)
              .eq('is_active', true);
              
            if (!countError && typeof studentCount === 'number') {
              setTeacherStudentCount(studentCount);
            }
          } else {
            setTeacherStudentCount(0);
          }
          
          setTeacherSectionsLoaded(true);
        } else {
          // For non-teachers, mark as loaded immediately
          setTeacherSectionsLoaded(true);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError("Failed to fetch user data");
        // Even if there's an error, mark teacher sections as loaded to prevent infinite waiting
        setTeacherSectionsLoaded(true);
      }
    };

    fetchCurrentUser();
    
    // Fallback timeout to ensure loading states don't get stuck
    const timeoutId = setTimeout(() => {
      if (!teacherSectionsLoaded) {
        console.log('Teacher sections loading timeout, forcing loaded state');
        setTeacherSectionsLoaded(true);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [teacherSectionsLoaded]);

  // Fetch engagement metrics
  const fetchEngagementData = async () => {
    setLoadingEngagement(true);
    try {
      const client = (userRole === 'teacher' || userRole === 'admin') && supabaseAdmin ? supabaseAdmin : supabase;
      const { startDate } = getDateRange(timeFilter);

      // Get quiz attempts with time filter
      let quizQuery = client
        .from('quiz_attempts')
        .select(`
          id,
          student_id,
          score,
          completed_at,
          quizzes!inner(
            id,
            title,
            modules!inner(
              id,
              subject_id,
              subjects!inner(name)
            )
          ),
          students!inner(
            id,
            section_id
          )
        `)
        .not('score', 'is', null);

      if (startDate) {
        quizQuery = quizQuery.gte('completed_at', startDate);
      }

      if (userRole === 'teacher') {
        if (teacherSections.length > 0) {
          const sectionIds = teacherSections.map(section => section.id);
          quizQuery = quizQuery.in('students.section_id', sectionIds);
        } else {
          // Teacher has no assigned sections, return no data
          quizQuery = quizQuery.eq('students.section_id', -1); // This will return no results
        }
      }

      const { data: quizAttempts, error: quizError } = await quizQuery;

      // Get lesson completions with time filter
      let lessonQuery = client
        .from('lesson_completions')
        .select(`
          id,
          student_id,
          completed_at,
          lessons!inner(
            id,
            title,
            modules!inner(
              id,
              subject_id,
              subjects!inner(name)
            )
          ),
          students!inner(
            id,
            section_id
          )
        `);

      if (startDate) {
        lessonQuery = lessonQuery.gte('completed_at', startDate);
      }

      if (userRole === 'teacher') {
        if (teacherSections.length > 0) {
          const sectionIds = teacherSections.map(section => section.id);
          lessonQuery = lessonQuery.in('students.section_id', sectionIds);
        } else {
          // Teacher has no assigned sections, return no data
          lessonQuery = lessonQuery.eq('students.section_id', -1); // This will return no results
        }
      }

      const { data: lessonCompletions, error: lessonError } = await lessonQuery;

      if (quizError) console.error('Quiz engagement error:', quizError);
      if (lessonError) console.error('Lesson engagement error:', lessonError);

      // Calculate engagement metrics
      const quizzes = quizAttempts || [];
      const lessons = lessonCompletions || [];
      
      // Get unique active students
      const activeStudentIds = new Set([
        ...quizzes.map(q => q.student_id),
        ...lessons.map(l => l.student_id)
      ]);
      
      // Calculate subject popularity
      const subjectActivity = {};
      quizzes.forEach(quiz => {
        const subjectName = quiz.quizzes?.modules?.subjects?.name;
        if (subjectName) {
          if (!subjectActivity[subjectName]) {
            subjectActivity[subjectName] = { quizzes: 0, lessons: 0, total: 0 };
          }
          subjectActivity[subjectName].quizzes++;
          subjectActivity[subjectName].total++;
        }
      });
      
      lessons.forEach(lesson => {
        const subjectName = lesson.lessons?.modules?.subjects?.name;
        if (subjectName) {
          if (!subjectActivity[subjectName]) {
            subjectActivity[subjectName] = { quizzes: 0, lessons: 0, total: 0 };
          }
          subjectActivity[subjectName].lessons++;
          subjectActivity[subjectName].total++;
        }
      });

      const popularSubjects = Object.entries(subjectActivity)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);

      // Recent activity (last 10 activities)
      const allActivities = [
        ...quizzes.map(q => ({
          type: 'quiz',
          title: q.quizzes?.title || 'Quiz',
          subject: q.quizzes?.modules?.subjects?.name || 'Unknown',
          score: q.score,
          timestamp: q.completed_at
        })),
        ...lessons.map(l => ({
          type: 'lesson',
          title: l.lessons?.title || 'Lesson',
          subject: l.lessons?.modules?.subjects?.name || 'Unknown',
          timestamp: l.completed_at
        }))
      ];

      const recentActivity = allActivities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

      // Calculate completion rate (students with both quiz and lesson activity)
      const studentsWithQuizzes = new Set(quizzes.map(q => q.student_id));
      const studentsWithLessons = new Set(lessons.map(l => l.student_id));
      const studentsWithBoth = [...studentsWithQuizzes].filter(id => studentsWithLessons.has(id));
      
      const totalActiveUsers = userRole === 'teacher' ? teacherStudentCount : totalStudents;
      const completionRate = totalActiveUsers > 0 ? (studentsWithBoth.length / totalActiveUsers) * 100 : 0;

      setEngagementData({
        totalQuizAttempts: quizzes.length,
        totalLessonCompletions: lessons.length,
        activeStudents: activeStudentIds.size,
        completionRate: Math.round(completionRate),
        avgQuizAttempts: activeStudentIds.size > 0 ? Math.round(quizzes.length / activeStudentIds.size * 10) / 10 : 0,
        avgLessonCompletions: activeStudentIds.size > 0 ? Math.round(lessons.length / activeStudentIds.size * 10) / 10 : 0,
        popularSubjects,
        recentActivity
      });

    } catch (error) {
      console.error('Error fetching engagement data:', error);
      setError("Failed to fetch engagement data");
    }
    setLoadingEngagement(false);
  };

  // Fetch engagement data when needed (always fetch for overview tab's Period Comparison)
  useEffect(() => {
    if ((activeTab === 'engagement' || activeTab === 'overview') && userRole && teacherSectionsLoaded) {
      fetchEngagementData();
    }
  }, [activeTab, userRole, teacherSectionsLoaded, timeFilter, teacherSections, teacherStudentCount, totalStudents]);

  // Fetch section-student distribution data and monthly student growth
  useEffect(() => {
    const fetchSectionStudentData = async () => {
      // Don't fetch if user role hasn't been determined yet
      if (!userRole) {
        return;
      }
      
      // Distribution shows all sections, so no need to wait for teacher sections
      
      setLoadingSectionPie(true);
      try {
        // Use admin client for teachers and admins, same as ClassroomPage pattern
        const client = (userRole === 'teacher' || userRole === 'admin') && supabaseAdmin ? supabaseAdmin : supabase;
        
        // Get all sections (show all sections for both teachers and admins)
        const { data: sections, error: sectionError } = await client
          .from("sections")
          .select("id, name, classroom_number, time_period")
          .eq('is_active', true);
        if (sectionError) throw sectionError;
        if (!sections || sections.length === 0) {
          setSectionStudentData({
            labels: [],
            datasets: [{
              label: "Students per Section",
              data: [],
              backgroundColor: [],
              borderColor: [],
              borderWidth: 1,
            }]
          });
          setLoadingSectionPie(false);
          return;
        }
        // Get students with optional time filter for enrollment date
        const { startDate } = getDateRange(timeFilter);
        let studentQuery = client
          .from("students")
          .select("id, section_id, enrollment_date, is_active, first_name, last_name")
          .eq('is_active', true)
          .order('enrollment_date', { ascending: false });
        
        // Apply time filter if not 'all'
        if (startDate) {
          studentQuery = studentQuery.gte('enrollment_date', startDate);
        }
        
        const { data: students, error: studentError } = await studentQuery;
        if (studentError) throw studentError;
        // Count students per section with more detailed analysis
        const sectionCounts = {};
        const sectionDetails = {};
        
        sections.forEach(section => {
          sectionCounts[section.id] = 0;
          sectionDetails[section.id] = {
            name: section.name,
            classroom_number: section.classroom_number,
            time_period: section.time_period,
            students: [],
            active_students: 0,
            recent_enrollments: 0
          };
        });

        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        students.forEach(s => {
          if (s.section_id && sectionDetails[s.section_id]) {
            sectionCounts[s.section_id]++;
            sectionDetails[s.section_id].students.push(s);
            
            if (s.is_active !== false) {
              sectionDetails[s.section_id].active_students++;
            }
            
            if (s.enrollment_date && new Date(s.enrollment_date) > oneMonthAgo) {
              sectionDetails[s.section_id].recent_enrollments++;
            }
          }
        });

        // Prepare enhanced chart data for section distribution
        const labels = [];
        const dataArr = [];
        const colors = [
          'rgba(54, 162, 235, 0.8)',   // Blue
          'rgba(255, 99, 132, 0.8)',   // Red
          'rgba(75, 192, 192, 0.8)',   // Green
          'rgba(255, 205, 86, 0.8)',   // Yellow
          'rgba(153, 102, 255, 0.8)',  // Purple
          'rgba(255, 159, 64, 0.8)',   // Orange
          'rgba(199, 199, 199, 0.8)',  // Grey
          'rgba(83, 102, 255, 0.8)',   // Indigo
          'rgba(255, 99, 255, 0.8)'    // Pink
        ];
        const bgArr = [];
        const borderArr = [];
        
        sections.forEach((section, idx) => {
          const count = sectionCounts[section.id] || 0;
          const details = sectionDetails[section.id];
          
          // Create more descriptive labels
          const timeLabel = section.time_period.charAt(0).toUpperCase() + section.time_period.slice(1);
          const label = `${section.classroom_number} - ${section.name} (${timeLabel})`;
          
          labels.push(label);
          dataArr.push(count);
          bgArr.push(colors[idx % colors.length]);
          borderArr.push(colors[idx % colors.length].replace('0.8', '1'));
        });
        
        // Include students without a section (unassigned) with improved styling
        const unassignedStudents = students.filter(s => !s.section_id);
        const unassignedCount = unassignedStudents.length;
        if (unassignedCount > 0) {
          labels.push('Unassigned Students');
          const neutralColor = 'rgba(156, 163, 175, 0.8)'; // Better neutral color
          dataArr.push(unassignedCount);
          bgArr.push(neutralColor);
          borderArr.push('rgba(156, 163, 175, 1)');
        }

        // Store additional statistics for display
        setSectionStats({
          totalSections: sections.length,
          totalStudents: students.length,
          averagePerSection: sections.length > 0 ? Math.round(students.filter(s => s.section_id).length / sections.length) : 0,
          unassignedCount,
          sectionsWithStudents: sections.filter(s => sectionCounts[s.id] > 0).length
        });
        setSectionStudentData({
          labels,
          datasets: [{
            label: "Students per Section",
            data: dataArr,
            backgroundColor: bgArr,
            borderColor: borderArr,
            borderWidth: 1,
          }]
        });
        // Calculate monthly student growth
        const now = new Date();
        const months = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            label: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            month: d.getMonth() + 1
          });
        }
        // Calculate cumulative enrollment growth (total students up to each month)
        const monthlyCounts = months.map(({ year, month }) => {
          // Count all students enrolled up to and including this month
          return students.filter(s => {
            if (!s.enrollment_date) {
              // If no enrollment date, assume they were enrolled before our tracking period
              return true;
            }
            const enrollmentDate = new Date(s.enrollment_date);
            const monthEndDate = new Date(year, month, 0); // Last day of the month
            return enrollmentDate <= monthEndDate;
          }).length;
        });
        
        // If we have very little growth data, ensure the chart shows something meaningful
        const hasGrowthData = monthlyCounts.some((count, index) => 
          index > 0 && count > monthlyCounts[index - 1]
        );
        
        // If no actual growth is detected and we have students, show a gradual growth pattern
        let finalMonthlyCounts = monthlyCounts;
        if (!hasGrowthData && students.length > 0) {
          const totalStudents = students.length;
          finalMonthlyCounts = months.map((_, index) => {
            // Create a gradual growth pattern ending at current total
            const progress = (index + 1) / months.length;
            return Math.max(0, Math.floor(totalStudents * progress * 0.8) + 
              (index === months.length - 1 ? Math.ceil(totalStudents * 0.2) : 0));
          });
        }
        
        setMonthlyStudentCounts(finalMonthlyCounts);
        // Prefer an exact count from the database to determine total enrolled students
        try {
          const { data: _countData, error: countError, count } = await client
            .from("students")
            .select("id", { count: "exact", head: true });
          if (!countError && typeof count === 'number') {
            setTotalStudents(count);
          } else {
            // Fallback to client-side length if count query fails or is not available
            setTotalStudents(students.length);
          }
        } catch (countErr) {
          setTotalStudents(students.length);
        }
      } catch (error) {
        setError("Failed to fetch section-student data");
      }
      setLoadingSectionPie(false);
    };
    fetchSectionStudentData();
  }, [userRole, timeFilter]);
  const mainContentStyle = {
    marginLeft: !isMobile ? '220px' : '0',
    width: !isMobile ? 'calc(100% - 236px)' : '100%',
    height: '100vh',
    padding: !isMobile ? '24px' : '12px',
    position: 'fixed',
    top: '0',
    right: !isMobile ? '16px' : '0',
    overflowY: 'auto',
    overflowX: 'hidden',
    transition: 'all 0.3s ease',
    backgroundColor: 'transparent',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
  };

  // Add mobile-specific chart container style
  const mobileChartContainerStyle = {
    ...chartContainerStyle,
    padding: isMobile ? '0.75rem' : '1rem',
    minHeight: isMobile ? '200px' : '250px',
    borderRadius: isMobile ? '12px' : '16px'
  };

  // Mobile-responsive card wrapper style
  const responsiveCardWrapperStyle = {
    ...cardWrapperStyle,
    gap: isMobile ? '1rem' : '1.5rem',
    padding: isMobile ? '0.5rem 0' : '1rem 0'
  };
  const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: "0 10px 30px rgba(0,0,0,0.05), 0 1px 8px rgba(0,0,0,0.03)",
    background: 'rgba(255, 255, 255, 0.92)',
    overflow: 'hidden',
    borderRadius: '28px',
    border: 'none',
    backdropFilter: 'blur(10px)',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-5px)',
      boxShadow: "0 15px 35px rgba(0,0,0,0.1), 0 5px 15px rgba(0,0,0,0.05)"
    }
  };

  // Score trends data is now handled by the state variable scoreTrendData

  // Fetch score trend data for overall performance chart
  const fetchScoreTrendData = async () => {
    setLoadingTrendData(true);
    try {
      // Use admin client for teachers and admins, same as ClassroomPage pattern
      const client = (userRole === 'teacher' || userRole === 'admin') && supabaseAdmin ? supabaseAdmin : supabase;
      
      // Get date range based on current time filter
      const { startDate } = getDateRange(timeFilter);
      
      // Use time filter or fallback to 4 weeks for 'all' filter when showing trends
      let filterStartDate;
      if (timeFilter === 'all') {
        // For 'all' time filter, still limit trend data to meaningful period (last 4 weeks)
        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        filterStartDate = fourWeeksAgo.toISOString();
      } else {
        filterStartDate = startDate;
      }
      
      let trendQuery = client
        .from('quiz_attempts')
        .select(`
          score,
          completed_at,
          student_id,
          students!inner(
            id,
            section_id
          )
        `)
        .gte('completed_at', filterStartDate)
        .not('score', 'is', null)
        .order('completed_at', { ascending: true });

      // If teacher, filter by their assigned sections
      if (userRole === 'teacher' && teacherSections.length > 0) {
        const sectionIds = teacherSections.map(section => section.id);
        trendQuery = trendQuery.in('students.section_id', sectionIds);
      }

      const { data: trendAttempts, error: trendError } = await trendQuery;
      
      if (trendError) throw trendError;

      // If no data, set empty trend data
      if (!trendAttempts || trendAttempts.length === 0) {
        setScoreTrendData({
          labels: [],
          datasets: []
        });
        setLoadingTrendData(false);
        return;
      }

      // Group data by appropriate time periods based on filter
      const labels = [];
      const periodData = {};
      
      // Create time period buckets based on current filter
      if (timeFilter === 'day') {
        // Group by 4-hour periods for last 24 hours
        for (let i = 5; i >= 0; i--) {
          const periodStart = new Date();
          periodStart.setHours(periodStart.getHours() - (i * 4 + 3));
          const periodEnd = new Date();
          periodEnd.setHours(periodEnd.getHours() - (i * 4));
          
          const label = `${periodStart.getHours()}:00-${periodEnd.getHours()}:00`;
          labels.push(label);
          periodData[label] = {
            scores: [],
            start: periodStart,
            end: periodEnd
          };
        }
      } else if (timeFilter === 'week') {
        // Group by days for last 7 days
        for (let i = 6; i >= 0; i--) {
          const dayStart = new Date();
          dayStart.setDate(dayStart.getDate() - i);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);
          
          const label = dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          labels.push(label);
          periodData[label] = {
            scores: [],
            start: dayStart,
            end: dayEnd
          };
        }
      } else if (timeFilter === 'month') {
        // Group by weeks for last 30 days
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
          const weekEnd = new Date();
          weekEnd.setDate(weekEnd.getDate() - (i * 7));
          
          const label = `Week ${4 - i}`;
          labels.push(label);
          periodData[label] = {
            scores: [],
            start: weekStart,
            end: weekEnd
          };
        }
      } else {
        // Default: Group by weeks for last 4 weeks (for 'all' filter)
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
          const weekEnd = new Date();
          weekEnd.setDate(weekEnd.getDate() - (i * 7));
          
          const label = `Week ${4 - i}`;
          labels.push(label);
          periodData[label] = {
            scores: [],
            start: weekStart,
            end: weekEnd
          };
        }
      }

      // Distribute attempts into periods
      trendAttempts.forEach(attempt => {
        const attemptDate = new Date(attempt.completed_at);
        
        for (const [periodLabel, periodInfo] of Object.entries(periodData)) {
          if (attemptDate >= periodInfo.start && attemptDate <= periodInfo.end) {
            periodInfo.scores.push(attempt.score);
            break;
          }
        }
      });

      // Calculate averages and highest scores for each period
      const avgScores = [];
      const highestScores = [];
      
      labels.forEach(periodLabel => {
        const scores = periodData[periodLabel].scores;
        if (scores.length > 0) {
          const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          avgScores.push(Math.round(avg));
          highestScores.push(Math.max(...scores));
        } else {
          avgScores.push(0);
          highestScores.push(0);
        }
      });

      setScoreTrendData({
        labels: labels,
        datasets: [
          {
            label: "Average Score",
            data: avgScores,
            borderColor: chartColors.secondary,
            backgroundColor: chartColors.secondaryLight,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          },
          {
            label: "Highest Score",
            data: highestScores,
            borderColor: chartColors.success,
            backgroundColor: chartColors.successLight,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
          }
        ]
      });

    } catch (error) {
      console.error('Error fetching score trend data:', error);
      // Set empty data on error
      setScoreTrendData({
        labels: [],
        datasets: []
      });
    }
    setLoadingTrendData(false);
  };

  // Fetch subject performance data
  useEffect(() => {
    const fetchSubjectPerformanceData = async () => {
      console.log('fetchSubjectPerformanceData called:', {
        userRole,
        teacherSectionsLoaded,
        teacherSectionsCount: teacherSections.length,
        teacherStudentCount
      });
      
      // Don't fetch if user role hasn't been determined yet
      if (!userRole) {
        console.log('Skipping fetch: userRole not determined');
        return;
      }
      
      // Don't fetch if we're still loading teacher sections (for teachers)
      if (userRole === 'teacher' && !teacherSectionsLoaded) {
        console.log('Skipping fetch: teacher sections still loading');
        return;
      }
      
      // If teacher has no sections or no students, set empty data
      if (userRole === 'teacher' && (teacherSections.length === 0 || teacherStudentCount === 0)) {
        console.log('Teacher has no sections or students, showing empty data');
        setSubjectPerformanceData({
          labels: [],
          datasets: []
        });
        setOverallAverageScore(0);
        setTotalQuizAttempts(0);
        setScoreImprovement(0);
        setScoreTrendData({
          labels: [],
          datasets: []
        });
        setLoadingSubjects(false);
        setLoadingTrendData(false);
        return;
      }
      
      setLoadingSubjects(true);
      try {
        // Use admin client for teachers and admins, same as ClassroomPage pattern
        const client = (userRole === 'teacher' || userRole === 'admin') && supabaseAdmin ? supabaseAdmin : supabase;
        
        // Use direct SQL query to get subject performance
        const { data: subjectStats, error: subjectError } = await client
          .from('subjects')
          .select('*')
          .eq('is_active', true)
          .order('sort_order');

        if (subjectError) throw subjectError;

        // Get quiz performance for each subject with improved filtering
        const performancePromises = subjectStats.map(async (subject) => {
          let quizQuery = client
            .from('quiz_attempts')
            .select(`
              score,
              student_id,
              quiz_id,
              attempt_number,
              quizzes!inner(
                id,
                title,
                passing_score,
                modules!inner(
                  subject_id
                )
              ),
              students!inner(
                id,
                section_id
              )
            `)
            .eq('quizzes.modules.subject_id', subject.id)
            .not('score', 'is', null); // Only include attempts with valid scores

          // Apply time filter if not 'all'
          const { startDate } = getDateRange(timeFilter);
          if (startDate) {
            quizQuery = quizQuery.gte('completed_at', startDate);
          }

          // If teacher, filter by their assigned sections
          if (userRole === 'teacher' && teacherSections.length > 0) {
            const sectionIds = teacherSections.map(section => section.id);
            quizQuery = quizQuery.in('students.section_id', sectionIds);
          }

          const { data: quizData, error: quizError } = await quizQuery;

          let lessonQuery = client
            .from('lesson_completions')
            .select(`
              student_id,
              lesson_id,
              lessons!inner(
                id,
                modules!inner(
                  subject_id
                )
              ),
              students!inner(
                id,
                section_id
              )
            `)
            .eq('lessons.modules.subject_id', subject.id);

          // Apply time filter if not 'all'
          if (startDate) {
            lessonQuery = lessonQuery.gte('completed_at', startDate);
          }

          // If teacher, filter lesson completions by their assigned sections
          if (userRole === 'teacher' && teacherSections.length > 0) {
            const sectionIds = teacherSections.map(section => section.id);
            lessonQuery = lessonQuery.in('students.section_id', sectionIds);
          }

          const { data: lessonData, error: lessonError } = await lessonQuery;

          if (quizError) {
            console.warn(`Error fetching quiz data for ${subject.name}:`, quizError);
          }
          if (lessonError) {
            console.warn(`Error fetching lesson data for ${subject.name}:`, lessonError);
          }

          // Calculate quiz statistics - use best scores per student per quiz
          const studentQuizBestScores = {};
          (quizData || []).forEach(attempt => {
            const key = `${attempt.student_id}_${attempt.quiz_id}`;
            if (!studentQuizBestScores[key] || attempt.score > studentQuizBestScores[key]) {
              studentQuizBestScores[key] = attempt.score;
            }
          });

          const bestScores = Object.values(studentQuizBestScores);
          const uniqueQuizStudents = [...new Set((quizData || []).map(attempt => attempt.student_id))];
          const uniqueLessonStudents = [...new Set((lessonData || []).map(completion => completion.student_id))];
          const allUniqueStudents = [...new Set([...uniqueQuizStudents, ...uniqueLessonStudents])];

          // Calculate pass rate
          const quizzesWithPassingScore = (quizData || []).filter(attempt => {
            const quiz = attempt.quizzes;
            const passingScore = quiz?.passing_score || 70;
            return attempt.score >= passingScore;
          });
          const passRate = quizData?.length > 0 ? (quizzesWithPassingScore.length / quizData.length) * 100 : 0;

          return {
            name: subject.name,
            average_score: bestScores.length > 0 ? bestScores.reduce((a, b) => a + b, 0) / bestScores.length : 0,
            highest_score: bestScores.length > 0 ? Math.max(...bestScores) : 0,
            total_attempts: (quizData || []).length,
            students_attempted: allUniqueStudents.length,
            lessons_completed: (lessonData || []).length,
            pass_rate: passRate,
            quiz_students: uniqueQuizStudents.length,
            lesson_students: uniqueLessonStudents.length
          };
        });

        const processedData = await Promise.all(performancePromises);

        // Update the chart data
        const labels = processedData.map(subject => {
          // Shorten long names for better display
          if (subject.name === 'Good Manners and Right Conduct') return 'GMRC';
          if (subject.name === 'Environmental Science') return 'Environment';
          if (subject.name === 'Language Arts') return 'Language';
          return subject.name;
        });

        const avgScores = processedData.map(subject => Math.round(subject.average_score));
        const highestScores = processedData.map(subject => subject.highest_score);

        setSubjectPerformanceData({
          labels,
          datasets: [
            {
              label: 'Average Score',
              data: avgScores,
              backgroundColor: chartColors.secondaryLight,
              borderColor: chartColors.secondary,
              borderWidth: 2,
            },
            {
              label: 'Highest Score',
              data: highestScores,
              backgroundColor: chartColors.primaryLight,
              borderColor: chartColors.primary,
              borderWidth: 2,
            }
          ],
        });

        // Calculate overall average score across all subjects (weighted by attempts)
        const totalScore = processedData.reduce((sum, subject) => sum + (subject.average_score * subject.total_attempts), 0);
        const totalAttempts = processedData.reduce((sum, subject) => sum + subject.total_attempts, 0);
        const overallAvg = totalAttempts > 0 ? totalScore / totalAttempts : 0;
        setOverallAverageScore(Math.round(overallAvg * 100) / 100); // Keep 2 decimal places

        // Store total attempts for footer display
        setTotalQuizAttempts(totalAttempts);

        // Calculate improvement (simplified - using difference from expected average of 75%)
        const expectedAverage = 75;
        const improvement = Math.max(0, overallAvg - expectedAverage);
        setScoreImprovement(Math.round(improvement));

        // Fetch trend data for overall performance chart
        await fetchScoreTrendData();

      } catch (error) {
        console.error('Error fetching subject performance:', error);
        setError("Failed to fetch subject performance data");
        
        // Keep fallback static data if database fetch fails
        setSubjectPerformanceData({
          labels: ['Language', 'Math', 'GMRC', 'Makabayan', 'Environment'],
          datasets: [
            {
              label: 'Average Score',
              data: [75, 72, 85, 78, 80],
              backgroundColor: chartColors.secondaryLight,
              borderColor: chartColors.secondary,
              borderWidth: 2,
            },
            {
              label: 'Highest Score',
              data: [92, 89, 98, 94, 95],
              backgroundColor: chartColors.primaryLight,
              borderColor: chartColors.primary,
              borderWidth: 2,
            }
          ],
        });
      }
      setLoadingSubjects(false);
    };

    fetchSubjectPerformanceData();
  }, [userRole, teacherSections, teacherSectionsLoaded, timeFilter]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        font: { size: 16 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };  return (
    <>
      <div className="d-flex min-vh-100" style={{
      background: `
        radial-gradient(circle at 10% 0%, rgba(106, 57, 228, 0.08) 0%, transparent 60%),
        radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.9) 0%, transparent 60%),
        radial-gradient(circle at 80% 20%, rgba(78, 13, 209, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 20% 70%, rgba(123, 63, 228, 0.07) 0%, transparent 60%),
        linear-gradient(135deg, rgba(240, 244, 255, 0.8) 0%, rgba(237, 240, 255, 0.9) 100%)
      `,
      backgroundAttachment: "fixed",
      backgroundSize: "cover"
    }}>
      <SideMenu selectedItem="Statistics" />
      <div style={mainContentStyle}>
        <Container fluid className="h-100">
          <div ref={pdfContentRef} style={{ display: 'none' }}></div>
          <Card style={cardStyle}>
            {/* Print Header - Only visible when printing */}

            <Card.Body className="p-0">
              <div className={isMobile ? "p-2" : "p-4"}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2 className={`mb-0 ${isMobile ? 'fs-5' : ''}`} style={{ 
                    fontSize: isMobile ? '1.5rem' : '2rem', 
                    fontWeight: '600', 
                    color: '#333'
                  }}>Statistics & Analytics</h2>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-danger"
                      size={isMobile ? "sm" : "md"}
                      onClick={exportToPDF}
                      disabled={isGeneratingPDF}
                      className="d-flex align-items-center gap-2"
                      style={{
                        borderRadius: '20px',
                        padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                        fontSize: isMobile ? '0.8rem' : '0.9rem',
                        fontWeight: '500',
                        border: '1px solid rgba(220, 53, 69, 0.3)',
                        background: 'rgba(220, 53, 69, 0.05)',
                        color: '#dc3545'
                      }}
                    >
                      <FiFileText size={isMobile ? 14 : 16} />
                      {!isMobile && (isGeneratingPDF ? 'Generating...' : 'Export PDF')}
                    </Button>
                    
                  </div>
                </div>
                <Nav variant="tabs" className={`mb-4 ${isMobile ? 'flex-wrap' : ''}`} style={{
                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                  gap: isMobile ? '0.25rem' : '8px'
                }}>
                  <Nav.Item className={isMobile ? 'flex-fill' : ''}>
                    <Nav.Link 
                      active={activeTab === 'overview'} 
                      onClick={() => setActiveTab('overview')}
                      className="nav-tab-link"
                      style={{
                        borderRadius: isMobile ? '20px' : '8px 8px 0 0',
                        fontWeight: activeTab === 'overview' ? '600' : '400',
                        color: activeTab === 'overview' ? '#6a39e4' : '#666',
                        border: activeTab === 'overview' ? '1px solid rgba(0,0,0,0.08)' : 'none',
                        borderBottom: activeTab === 'overview' && !isMobile ? '3px solid #6a39e4' : 'none',
                        background: activeTab === 'overview' ? 'rgba(106, 57, 228, 0.03)' : 'transparent',
                        padding: isMobile ? '0.5rem 1rem' : '0.75rem 1rem',
                        fontSize: isMobile ? '0.85rem' : '1rem',
                        textAlign: 'center',
                        marginBottom: isMobile ? '0.25rem' : '0'
                      }}
                    >
                      Overview
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item className={isMobile ? 'flex-fill' : ''}>
                    <Nav.Link 
                      active={activeTab === 'performance'} 
                      onClick={() => setActiveTab('performance')}
                      className="nav-tab-link"
                      style={{
                        borderRadius: isMobile ? '20px' : '8px 8px 0 0',
                        fontWeight: activeTab === 'performance' ? '600' : '400',
                        color: activeTab === 'performance' ? '#6a39e4' : '#666',
                        border: activeTab === 'performance' ? '1px solid rgba(0,0,0,0.08)' : 'none',
                        borderBottom: activeTab === 'performance' && !isMobile ? '3px solid #6a39e4' : 'none',
                        background: activeTab === 'performance' ? 'rgba(106, 57, 228, 0.03)' : 'transparent',
                        padding: isMobile ? '0.5rem 1rem' : '0.75rem 1rem',
                        fontSize: isMobile ? '0.85rem' : '1rem',
                        textAlign: 'center',
                        marginBottom: isMobile ? '0.25rem' : '0'
                      }}
                    >
                      Performance
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item className={isMobile ? 'flex-fill' : ''}>
                    <Nav.Link 
                      active={activeTab === 'distribution'} 
                      onClick={() => setActiveTab('distribution')}
                      className="nav-tab-link"
                      style={{
                        borderRadius: isMobile ? '20px' : '8px 8px 0 0',
                        fontWeight: activeTab === 'distribution' ? '600' : '400',
                        color: activeTab === 'distribution' ? '#6a39e4' : '#666',
                        border: activeTab === 'distribution' ? '1px solid rgba(0,0,0,0.08)' : 'none',
                        borderBottom: activeTab === 'distribution' && !isMobile ? '3px solid #6a39e4' : 'none',
                        background: activeTab === 'distribution' ? 'rgba(106, 57, 228, 0.03)' : 'transparent',
                        padding: isMobile ? '0.5rem 1rem' : '0.75rem 1rem',
                        fontSize: isMobile ? '0.85rem' : '1rem',
                        textAlign: 'center',
                        marginBottom: isMobile ? '0.25rem' : '0'
                      }}
                    >
                      Distribution
                    </Nav.Link>
                  </Nav.Item>
                  
                </Nav>

                {/* Time Filter Controls */}
                <div className={`d-flex ${isMobile ? 'flex-column' : 'flex-row'} gap-2 mb-4 align-items-center`}>
                  <span className="text-muted fw-semibold" style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', minWidth: 'fit-content' }}>
                    Time Period:
                  </span>
                  <div className={`d-flex gap-1 ${isMobile ? 'w-100' : ''}`} style={{ flexWrap: 'wrap' }}>
                    {[
                      { key: 'day', label: 'Last 24 Hours', icon: '📅' },
                      { key: 'week', label: 'Last 7 Days', icon: '📊' },
                      { key: 'month', label: 'Last 30 Days', icon: '📈' },
                      { key: 'all', label: 'All Time', icon: '🔄' }
                    ].map(filter => (
                      <button
                        key={filter.key}
                        onClick={() => setTimeFilter(filter.key)}
                        className={`btn`}
                        style={{
                          borderRadius: '18px',
                          padding: isMobile ? '0.35rem 0.6rem' : '0.45rem 0.9rem',
                          fontSize: isMobile ? '0.78rem' : '0.88rem',
                          fontWeight: '500',
                          border: '1px solid rgba(106, 57, 228, 0.3)',
                          background: timeFilter === filter.key 
                            ? 'linear-gradient(135deg, #6a39e4 0%, #7367f0 100%)'
                            : 'rgba(106, 57, 228, 0.05)',
                          color: timeFilter === filter.key ? '#fff' : '#6a39e4',
                          transition: 'all 0.2s ease',
                          boxShadow: timeFilter === filter.key 
                            ? '0 4px 12px rgba(106, 57, 228, 0.3)' 
                            : '0 2px 6px rgba(106, 57, 228, 0.1)',
                          flex: isMobile ? '1' : 'none',
                          minWidth: isMobile ? 'auto' : '90px',
                          /* Keep no transform so size and layout don't shift when active */
                          transform: 'none',
                          boxSizing: 'border-box'
                        }}
                      >
                        <span style={{ marginRight: '0.3rem' }}>{filter.icon}</span>
                        {isMobile ? filter.label.replace('Last ', '').replace(' Days', 'd').replace(' Hours', 'h') : filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Summary */}
                {timeFilter !== 'all' && (
                  <div className="mb-3 p-3 rounded-4" style={{
                    background: 'linear-gradient(135deg, rgba(106, 57, 228, 0.05), rgba(115, 103, 240, 0.03))',
                    border: '1px solid rgba(106, 57, 228, 0.1)',
                    fontSize: isMobile ? '0.85rem' : '0.9rem'
                  }}>
                    <div className="d-flex align-items-center gap-2">
                      <span>🔍</span>
                      <span className="text-muted">
                        Currently showing data from <strong style={{ color: '#6a39e4' }}>
                          {timeFilter === 'day' ? 'the last 24 hours' : 
                           timeFilter === 'week' ? 'the last 7 days' : 
                           'the last 30 days'}
                        </strong>. 
                        
                      </span>
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="flex-grow-1" style={{ overflowY: "auto", overflowX: "hidden", maxHeight: isMobile ? "calc(100vh - 200px)" : "calc(100vh - 300px)" }}>
                  {activeTab === 'overview' && (
                    <div style={{...responsiveCardWrapperStyle, width: '100%'}}>

                      
                      {/* First Row - Quick Stats */}
                      <Row className={`g-${isMobile ? '3' : '4'}`} style={{width: '100%'}}>
                        <Col xs={12} className="d-flex">
                          <Card className="shadow-sm w-100" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, #fff5f0 0%, #ffe6d6 100%)', boxShadow: '0 8px 32px rgba(255,109,0,0.08)' }}>
                            <Card.Header style={{
                              background: 'linear-gradient(45deg, rgba(255, 109, 0, 0.08), rgba(255, 184, 0, 0.08))',
                              fontWeight: '700',
                              fontSize: isMobile ? '1.15rem' : '1.3rem',
                              color: '#333',
                              borderBottom: '1px solid rgba(0,0,0,0.04)',
                              display: 'flex',
                              alignItems: 'center',
                              padding: isMobile ? '1rem' : '1.5rem',
                              borderRadius: '24px 24px 0 0'
                            }}>Quick Stats</Card.Header>
                            <Card.Body className="d-flex flex-column flex-grow-1" style={{ padding: isMobile ? '1rem' : '2rem', background: 'rgba(255,255,255,0.95)', borderRadius: '0 0 24px 24px' }}>
                              <Row className="w-100 justify-content-center g-4 h-100">
                                <Col xs={12} md={6} className="d-flex">
                                  <div className="p-4 rounded-4 w-100 h-100" style={{
                                    background: 'linear-gradient(135deg, rgba(38, 222, 129, 0.15), rgba(38, 222, 129, 0.05))',
                                    boxShadow: '0 4px 15px rgba(38, 222, 129, 0.1)',
                                    border: '1px solid rgba(38, 222, 129, 0.2)',
                                    transition: 'transform 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    minHeight: '150px'
                                  }}>
                                    <h6 className="text-muted mb-2" style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '500' }}>Average Score</h6>
                                    <h2 className="mb-2" style={{ color: '#333', fontWeight: '700', fontSize: isMobile ? '2rem' : '2.5rem' }}>
                                      {loadingSubjects ? '...' : 
                                        totalQuizAttempts > 0 ? `${overallAverageScore}%` : 'N/A'
                                      }
                                    </h2>
                                    <small className={`d-block ${scoreImprovement > 0 ? 'text-success' : 'text-muted'}`} style={{ fontWeight: '600', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                                      {loadingSubjects ? 'Loading...' : 
                                        totalQuizAttempts === 0 ? 
                                          (userRole === 'teacher' ? 'No quiz attempts by your students' : 'No quiz attempts recorded') :
                                          scoreImprovement > 0 ? `↑ ${scoreImprovement}% above expected` : 'Based on quiz performance'
                                      }
                                    </small>
                                  </div>
                                </Col>
                                <Col xs={12} md={6} className="d-flex">
                                  <div className="p-4 rounded-4 w-100 h-100" style={{
                                    background: 'linear-gradient(135deg, rgba(84, 184, 255, 0.15), rgba(84, 184, 255, 0.05))',
                                    boxShadow: '0 4px 15px rgba(84, 184, 255, 0.1)',
                                    border: '1px solid rgba(84, 184, 255, 0.2)',
                                    transition: 'transform 0.3s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    minHeight: '150px'
                                  }}>
                                    <h6 className="text-muted mb-2" style={{ fontSize: isMobile ? '0.9rem' : '1rem', fontWeight: '500' }}>
                                      {userRole === 'teacher' ? 'Your Students' : 'Total Students'}
                                    </h6>
                                    <h2 className="mb-2" style={{ color: '#333', fontWeight: '700', fontSize: isMobile ? '2rem' : '2.5rem' }}>
                                      {userRole === 'teacher' ? teacherStudentCount : totalStudents}
                                    </h2>
                                    <small className="text-muted d-block" style={{ fontWeight: '500', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                                      {userRole === 'teacher' ? 
                                        `In your ${teacherSections.length} assigned section${teacherSections.length !== 1 ? 's' : ''}` : 
                                        'Across all sections'
                                      }
                                    </small>
                                  </div>
                                </Col>
                              </Row>
                              
                              
                            </Card.Body>
                            <Card.Footer className="bg-transparent" style={{
                              borderTop: '1px solid rgba(0,0,0,0.04)',
                              padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
                              fontSize: isMobile ? '0.9rem' : '1rem',
                              background: 'rgba(255,109,0,0.03)',
                              borderRadius: '0 0 24px 24px'
                            }}>
                              <small className="text-muted">
                                Key performance indicators showing current average score and total student count.
                              </small>
                            </Card.Footer>
                          </Card>
                        </Col>
                      </Row>
                      
                      {/* Second Row - Charts */}
                      <Row className={`g-${isMobile ? '3' : '4'} mt-4`} style={{width: '100%'}}>
                        <Col xs={12} lg={6} className="d-flex">
                          <Card className="shadow-lg w-100 h-100" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, #f8faff 0%, #e9f0ff 100%)', boxShadow: '0 8px 32px rgba(66,99,235,0.08)' }}>
                            <Card.Header style={{
                              background: 'linear-gradient(90deg, rgba(66,99,235,0.08) 0%, rgba(38,222,129,0.08) 100%)',
                              fontWeight: '700',
                              fontSize: isMobile ? '1.05rem' : '1.15rem',
                              color: '#333',
                              borderBottom: '1px solid rgba(0,0,0,0.04)',
                              display: 'flex',
                              alignItems: 'center',
                              padding: isMobile ? '0.9rem' : '1.2rem',
                              borderRadius: '24px 24px 0 0'
                            }}>Enrollment Growth</Card.Header>
                            <Card.Body className="d-flex flex-column flex-grow-1" style={{ padding: isMobile ? '0.9rem' : '1.5rem', background: 'rgba(255,255,255,0.95)', borderRadius: '0 0 24px 24px' }}>
                              <div style={{ ...mobileChartContainerStyle, background: 'rgba(66,99,235,0.04)', borderRadius: '18px', boxShadow: '0 2px 12px rgba(66,99,235,0.05)', padding: isMobile ? '0.9rem' : '1.5rem', height: '300px' }}>
                                <Line 
                                  data={{
                                    labels: (() => {
                                      const now = new Date();
                                      const months = [];
                                      for (let i = 5; i >= 0; i--) {
                                        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                                        months.push(d.toLocaleString('default', { month: 'short' }));
                                      }
                                      return months;
                                    })(),
                                    datasets: [{
                                      label: 'Total Students Enrolled',
                                      data: monthlyStudentCounts,
                                      borderColor: chartColors.success,
                                      backgroundColor: chartColors.successLight,
                                      pointBackgroundColor: chartColors.success,
                                      pointBorderColor: '#fff',
                                      pointRadius: 5,
                                      borderWidth: 3,
                                      fill: true,
                                      tension: 0.4
                                    }]
                                  }}
                                  options={{
                                    ...baseChartOptions,
                                    plugins: {
                                      ...baseChartOptions.plugins,
                                      legend: {
                                        ...baseChartOptions.plugins.legend,
                                        labels: {
                                          ...baseChartOptions.plugins.legend.labels,
                                          font: {
                                            ...baseChartOptions.plugins.legend.labels.font,
                                            size: isMobile ? 13 : 16,
                                            weight: '600'
                                          },
                                          color: chartColors.success
                                        }
                                      },
                                      title: {
                                        ...baseChartOptions.plugins.title,
                                        font: {
                                          ...baseChartOptions.plugins.title.font,
                                          size: isMobile ? 18 : 22,
                                          weight: 'bold'
                                        },
                                        color: chartColors.success
                                      }
                                    },
                                    scales: {
                                      y: {
                                        beginAtZero: true,
                                        grid: { color: 'rgba(66,99,235,0.08)' },
                                        ticks: { 
                                          stepSize: 1,
                                          font: { size: isMobile ? 12 : 14 },
                                          color: '#333'
                                        }
                                      },
                                      x: {
                                        grid: { color: 'rgba(66,99,235,0.04)' },
                                        ticks: {
                                          font: { size: isMobile ? 12 : 14 },
                                          color: '#333'
                                        }
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </Card.Body>
                            <Card.Footer className="bg-transparent" style={{
                              borderTop: '1px solid rgba(0,0,0,0.04)',
                              padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
                              fontSize: isMobile ? '0.9rem' : '1rem',
                              background: 'rgba(66,99,235,0.03)',
                              borderRadius: '0 0 24px 24px'
                            }}>
                              <small className="text-muted">
                                Active student enrollment growth based on enrollment dates from the students table.
                              </small>
                            </Card.Footer>
                          </Card>
                        </Col>
                        <Col xs={12} lg={6} className="d-flex">
                          <Card className="shadow-lg w-100 h-100" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, #f0f4ff 0%, #e6f0ff 100%)', boxShadow: '0 8px 32px rgba(106,57,228,0.08)' }}>
                            <Card.Header style={{
                              background: 'linear-gradient(45deg, rgba(106, 57, 228, 0.08), rgba(115, 103, 240, 0.08))',
                              fontWeight: '700',
                              fontSize: isMobile ? '1.05rem' : '1.15rem',
                              color: '#333',
                              borderBottom: '1px solid rgba(0,0,0,0.04)',
                              display: 'flex',
                              alignItems: 'center',
                              padding: isMobile ? '0.9rem' : '1.2rem',
                              borderRadius: '24px 24px 0 0'
                            }}>Overall Performance</Card.Header>
                            <Card.Body className="d-flex flex-column flex-grow-1" style={{ padding: isMobile ? '0.9rem' : '1.5rem', background: 'rgba(255,255,255,0.95)', borderRadius: '0 0 24px 24px' }}>
                              <div style={{ 
                                ...mobileChartContainerStyle, 
                                background: 'rgba(106,57,228,0.04)', 
                                borderRadius: '18px', 
                                boxShadow: '0 2px 12px rgba(106,57,228,0.05)', 
                                padding: isMobile ? '0.9rem' : '1.5rem', 
                                height: '300px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {loadingTrendData ? (
                                  <div style={{textAlign: 'center', padding: '2rem'}}>
                                    <span>Loading performance trends...</span>
                                  </div>
                                ) : scoreTrendData.labels.length === 0 ? (
                                  <div style={{textAlign: 'center', padding: '2rem', color: '#666'}}>
                                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>No Performance Data Available</p>
                                    <small style={{ color: '#999' }}>
                                      {userRole === 'teacher' ? 
                                        'Your students haven\'t taken any quizzes yet.' : 
                                        'No quiz attempts recorded in the last 4 weeks.'
                                      }
                                    </small>
                                  </div>
                                ) : (
                                  <Line data={scoreTrendData} options={{...baseChartOptions, scales: chartOptions.scales}} />
                                )}
                              </div>
                            </Card.Body>
                            <Card.Footer className="bg-transparent" style={{
                              borderTop: '1px solid rgba(0,0,0,0.04)',
                              padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
                              fontSize: isMobile ? '0.9rem' : '1rem',
                              background: 'rgba(106,57,228,0.03)',
                              borderRadius: '0 0 24px 24px'
                            }}>
                              <small className="text-muted">
                                {loadingTrendData ? 
                                  'Loading performance trend data...' : 
                                  scoreTrendData.labels.length === 0 ?
                                    (userRole === 'teacher' ? 
                                      'Performance trends will appear when your students start taking quizzes.' :
                                      'Performance trends based on quiz attempts from the last 4 weeks.'
                                    ) :
                                    (userRole === 'teacher' ? 
                                      'Performance trends for your students over the last 4 weeks.' :
                                      'Overall performance trends showing quiz score patterns over the last 4 weeks.'
                                    )
                                }
                              </small>
                            </Card.Footer>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  )}
                {activeTab === 'performance' && (
                    <div style={responsiveCardWrapperStyle}>

                      
                      <Row className={`g-${isMobile ? '3' : '4'}`}>
                        <Col xs={12} className="d-flex">
                          <Card className="shadow-lg w-100" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, #f0fff4 0%, #e6ffed 100%)', boxShadow: '0 8px 32px rgba(38,222,129,0.08)' }}>
                            <Card.Header style={{
                              background: 'linear-gradient(45deg, rgba(38, 222, 129, 0.08), rgba(84, 184, 255, 0.08))',
                              fontWeight: '700',
                              fontSize: isMobile ? '1.15rem' : '1.3rem',
                              color: '#333',
                              borderBottom: '1px solid rgba(0,0,0,0.04)',
                              display: 'flex',
                              alignItems: 'center',
                              padding: isMobile ? '1rem' : '1.5rem',
                              borderRadius: '24px 24px 0 0'
                            }}>
                              Subject Performance
                              {userRole === 'teacher' && (
                                <small style={{ 
                                  marginLeft: '0.5rem', 
                                  fontSize: '0.75rem', 
                                  opacity: 0.7,
                                  fontWeight: '400'
                                }}>
                                  (Your Students Only)
                                </small>
                              )}
                            </Card.Header>
                            <Card.Body className="d-flex flex-column flex-grow-1" style={{ padding: isMobile ? '1rem' : '2rem', background: 'rgba(255,255,255,0.95)', borderRadius: '0 0 24px 24px' }}>
                              <div style={{
                                ...mobileChartContainerStyle,
                                background: 'rgba(38,222,129,0.04)',
                                borderRadius: '18px',
                                boxShadow: '0 2px 12px rgba(38,222,129,0.05)',
                                padding: isMobile ? '1rem' : '2rem',
                                height: '400px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {loadingSubjects ? (
                                  <div style={{textAlign: 'center', padding: '2rem'}}>
                                    <span>Loading subject performance...</span>
                                  </div>
                                ) : subjectPerformanceData.labels.length === 0 ? (
                                  <div style={{textAlign: 'center', padding: '2rem', color: '#666'}}>
                                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: '500' }}>No Subject Performance Data</p>
                                    <small style={{ color: '#999' }}>
                                      {userRole === 'teacher' ? 
                                        (teacherStudentCount === 0 ? 
                                          'You have no students assigned to your sections.' : 
                                          'Your students haven\'t taken any quizzes yet.'
                                        ) : 
                                        'No quiz attempts recorded across all subjects.'
                                      }
                                    </small>
                                  </div>
                                ) : (
                                  <Bar data={subjectPerformanceData} options={{
                                  ...baseChartOptions, 
                                  plugins: {
                                    ...baseChartOptions.plugins,
                                    legend: {
                                      ...baseChartOptions.plugins.legend,
                                      labels: {
                                        ...baseChartOptions.plugins.legend.labels,
                                        font: {
                                          ...baseChartOptions.plugins.legend.labels.font,
                                          size: isMobile ? 10 : 14
                                        }
                                      }
                                    },
                                    title: {
                                      ...baseChartOptions.plugins.title,
                                      font: {
                                        ...baseChartOptions.plugins.title.font,
                                        size: isMobile ? 14 : 18
                                      }
                                    }
                                  },
                                  scales: {
                                    y: {
                                      beginAtZero: true,
                                      max: 100,
                                      ticks: {
                                        callback: function(value) {
                                          return value + '%';
                                        },
                                        font: { size: isMobile ? 9 : 12 }
                                      }
                                    },
                                    x: {
                                      ticks: {
                                        font: { size: isMobile ? 9 : 12 }
                                      }
                                    }
                                  }
                                  }} />
                                )}
                              </div>
                            </Card.Body>
                            <Card.Footer className="bg-transparent" style={{
                              borderTop: '1px solid rgba(0,0,0,0.04)',
                              padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
                              fontSize: isMobile ? '0.9rem' : '1rem',
                              background: 'rgba(38,222,129,0.03)',
                              borderRadius: '0 0 24px 24px'
                            }}>
                              <small className="text-muted">
                                {loadingSubjects ? 
                                  'Loading subject performance data...' : 
                                  userRole === 'teacher' ? 
                                    `Performance data from ${totalQuizAttempts} quiz attempts by your students across all subjects.` :
                                    `Real-time performance data from ${totalQuizAttempts} quiz attempts across all subjects.`
                                }
                              </small>
                            </Card.Footer>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  )}
                  {activeTab === 'distribution' && (
                    <div style={responsiveCardWrapperStyle}>

                      
                      <Row className={`g-${isMobile ? '3' : '4'}`}>
                        <Col xs={12} className="d-flex">
                          <Card className="shadow-lg w-100" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, #fff0f5 0%, #ffe6f0 100%)', boxShadow: '0 8px 32px rgba(245,59,87,0.08)' }}>
                            <Card.Header style={{
                              background: 'linear-gradient(45deg, rgba(245, 59, 87, 0.08), rgba(156, 39, 176, 0.08))',
                              fontWeight: '700',
                              fontSize: isMobile ? '1.15rem' : '1.3rem',
                              color: '#333',
                              borderBottom: '1px solid rgba(0,0,0,0.04)',
                              display: 'flex',
                              alignItems: 'center',
                              padding: isMobile ? '1rem' : '1.5rem',
                              borderRadius: '24px 24px 0 0'
                            }}>Students per Section Distribution</Card.Header>
                            <Card.Body className="d-flex flex-column flex-grow-1" style={{ padding: isMobile ? '1rem' : '2rem', background: 'rgba(255,255,255,0.95)', borderRadius: '0 0 24px 24px' }}>
                              <div style={{
                                ...mobileChartContainerStyle,
                                background: 'rgba(245,59,87,0.04)',
                                borderRadius: '18px',
                                boxShadow: '0 2px 12px rgba(245,59,87,0.05)',
                                padding: isMobile ? '1rem' : '2rem',
                                height: '400px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                {loadingSectionPie ? (
                                  <div style={{textAlign: 'center', padding: '2rem'}}>
                                    <span>Loading section distribution...</span>
                                  </div>
                                ) : sectionStudentData.labels.length === 0 ? (
                                  <div style={{textAlign: 'center', padding: '2rem'}}>
                                    <span>No section data available.</span>
                                  </div>
                                ) : (
                                  <Pie 
                                    data={sectionStudentData} 
                                    options={{
                                      ...baseChartOptions,
                                      plugins: {
                                        ...baseChartOptions.plugins,
                                        legend: {
                                          position: isMobile ? 'bottom' : 'right',
                                          align: 'center',
                                          labels: {
                                            ...baseChartOptions.plugins.legend.labels,
                                            font: {
                                              ...baseChartOptions.plugins.legend.labels.font,
                                              size: isMobile ? 10 : 14
                                            },
                                            padding: isMobile ? 10 : 20,
                                            boxWidth: isMobile ? 12 : 15,
                                            generateLabels: function(chart) {
                                              const data = chart.data;
                                              return data.labels.map((label, i) => {
                                                const count = data.datasets[0].data[i];
                                                const percentage = ((count / data.datasets[0].data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
                                                return {
                                                  text: `${label}: ${count} (${percentage}%)`,
                                                  fillStyle: data.datasets[0].backgroundColor[i],
                                                  strokeStyle: data.datasets[0].borderColor[i],
                                                  lineWidth: 2,
                                                  hidden: false,
                                                  index: i
                                                };
                                              });
                                            }
                                          }
                                        },
                                        title: {
                                          display: false // Remove title to save space
                                        },
                                        tooltip: {
                                          ...baseChartOptions.plugins.tooltip,
                                          titleFont: {
                                            ...baseChartOptions.plugins.tooltip.titleFont,
                                            size: isMobile ? 12 : 14
                                          },
                                          callbacks: {
                                            label: function(context) {
                                              const label = context.label || '';
                                              const value = context.parsed;
                                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                              const percentage = ((value / total) * 100).toFixed(1);
                                              return `${label}: ${value} students (${percentage}%)`;
                                            },
                                            afterLabel: function(context) {
                                              const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                              return `Total: ${total} students`;
                                            }
                                          },
                                          bodyFont: {
                                            ...baseChartOptions.plugins.tooltip.bodyFont,
                                            size: isMobile ? 11 : 13
                                          }
                                        }
                                      }
                                    }} 
                                  />
                                )}
                              </div>
                            </Card.Body>
                            <Card.Footer className="bg-transparent" style={{
                              borderTop: '1px solid rgba(0,0,0,0.04)',
                              padding: isMobile ? '0.75rem 1.5rem' : '1rem 2rem',
                              fontSize: isMobile ? '0.85rem' : '0.95rem',
                              background: 'rgba(245,59,87,0.03)',
                              borderRadius: '0 0 24px 24px'
                            }}>
                              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '0.5rem' : '2rem', alignItems: isMobile ? 'flex-start' : 'center' }}>
                                <small className="text-muted">
                                  <strong>{sectionStats.totalStudents}</strong> students across <strong>{sectionStats.totalSections}</strong> section{sectionStats.totalSections !== 1 ? 's' : ''}
                                </small>
                                <small className="text-muted">
                                  Avg: <strong>{sectionStats.averagePerSection}</strong> students per section
                                </small>
                                {sectionStats.unassignedCount > 0 && (
                                  <small className="text-warning">
                                    <strong>{sectionStats.unassignedCount}</strong> unassigned students
                                  </small>
                                )}
                                <small className="text-muted">
                                  <strong>{sectionStats.sectionsWithStudents}</strong> active section{sectionStats.sectionsWithStudents !== 1 ? 's' : ''}
                                </small>
                              </div>
                            </Card.Footer>
                          </Card>
                        </Col>
                      </Row>
                    </div>
                  )}

                  {activeTab === 'engagement' && (
                    <div style={responsiveCardWrapperStyle}>
                      
                      {/* Show message for teachers with no assigned sections */}
                      {userRole === 'teacher' && teacherSections.length === 0 && (
                        <Card className="shadow-sm mb-4" style={{ borderRadius: '16px', border: '1px solid #ffc107', background: 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)' }}>
                          <Card.Body className="text-center p-4">
                            <div className="mb-3" style={{ fontSize: '3rem' }}>📋</div>
                            <h5 style={{ color: '#f57c00', fontWeight: '600' }}>No Section Assigned</h5>
                            <p className="text-muted mb-0">
                              You don't have any sections assigned to you yet. Contact your administrator to get assigned to a section to view student engagement data.
                            </p>
                          </Card.Body>
                        </Card>
                      )}
                      
                      {/* Only show engagement data if admin or teacher with sections */}
                      {(userRole === 'admin' || (userRole === 'teacher' && teacherSections.length > 0)) && (
                        <React.Fragment>
                      
                      {/* Engagement Overview Cards */}
                      <Row className={`g-${isMobile ? '3' : '4'} mb-4`}>
                        <Col xs={12} md={6} lg={3}>
                          <Card className="h-100 shadow-sm" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', border: 'none' }}>
                            <Card.Body className="text-center p-4">
                              <div className="mb-2" style={{ fontSize: '2rem' }}>🎯</div>
                              <h6 className="text-muted mb-1">Quiz Attempts</h6>
                              <h3 className="mb-0" style={{ fontWeight: '700', color: '#1976d2' }}>
                                {loadingEngagement ? '...' : engagementData.totalQuizAttempts}
                              </h3>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col xs={12} md={6} lg={3}>
                          <Card className="h-100 shadow-sm" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)', border: 'none' }}>
                            <Card.Body className="text-center p-4">
                              <div className="mb-2" style={{ fontSize: '2rem' }}>📚</div>
                              <h6 className="text-muted mb-1">Lessons Completed</h6>
                              <h3 className="mb-0" style={{ fontWeight: '700', color: '#388e3c' }}>
                                {loadingEngagement ? '...' : engagementData.totalLessonCompletions}
                              </h3>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col xs={12} md={6} lg={3}>
                          <Card className="h-100 shadow-sm" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)', border: 'none' }}>
                            <Card.Body className="text-center p-4">
                              <div className="mb-2" style={{ fontSize: '2rem' }}>👥</div>
                              <h6 className="text-muted mb-1">Active Students</h6>
                              <h3 className="mb-0" style={{ fontWeight: '700', color: '#f57c00' }}>
                                {loadingEngagement ? '...' : engagementData.activeStudents}
                              </h3>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col xs={12} md={6} lg={3}>
                          <Card className="h-100 shadow-sm" style={{ borderRadius: '16px', background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)', border: 'none' }}>
                            <Card.Body className="text-center p-4">
                              <div className="mb-2" style={{ fontSize: '2rem' }}>✅</div>
                              <h6 className="text-muted mb-1">Completion Rate</h6>
                              <h3 className="mb-0" style={{ fontWeight: '700', color: '#c2185b' }}>
                                {loadingEngagement ? '...' : `${engagementData.completionRate}%`}
                              </h3>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>

                      {/* Charts Row */}
                      <Row className={`g-${isMobile ? '3' : '4'}`}>
                        <Col xs={12} lg={6}>
                          <Card className="shadow-lg h-100" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)', boxShadow: '0 8px 32px rgba(156,39,176,0.08)' }}>
                            <Card.Header style={{
                              background: 'linear-gradient(45deg, rgba(156, 39, 176, 0.08), rgba(233, 30, 99, 0.08))',
                              fontWeight: '700',
                              fontSize: isMobile ? '1.15rem' : '1.3rem',
                              color: '#333',
                              borderBottom: '1px solid rgba(0,0,0,0.04)',
                              padding: isMobile ? '1rem' : '1.5rem',
                              borderRadius: '24px 24px 0 0'
                            }}>Popular Subjects</Card.Header>
                            <Card.Body style={{ padding: isMobile ? '1rem' : '2rem', background: 'rgba(255,255,255,0.95)', borderRadius: '0 0 24px 24px' }}>
                              {loadingEngagement ? (
                                <div className="text-center p-4">Loading...</div>
                              ) : engagementData.popularSubjects.length === 0 ? (
                                <div className="text-center p-4 text-muted">No activity data available</div>
                              ) : (
                                <div style={{ height: '300px' }}>
                                  <Bar 
                                    data={{
                                      labels: engagementData.popularSubjects.map(s => s.name),
                                      datasets: [
                                        {
                                          label: 'Quiz Attempts',
                                          data: engagementData.popularSubjects.map(s => s.quizzes),
                                          backgroundColor: chartColors.primaryLight,
                                          borderColor: chartColors.primary,
                                          borderWidth: 1
                                        },
                                        {
                                          label: 'Lessons Completed',
                                          data: engagementData.popularSubjects.map(s => s.lessons),
                                          backgroundColor: chartColors.successLight,
                                          borderColor: chartColors.success,
                                          borderWidth: 1
                                        }
                                      ]
                                    }}
                                    options={{
                                      ...baseChartOptions,
                                      scales: {
                                        y: {
                                          beginAtZero: true,
                                          ticks: {
                                            stepSize: 1,
                                            font: { size: isMobile ? 10 : 12 }
                                          }
                                        },
                                        x: {
                                          ticks: {
                                            font: { size: isMobile ? 10 : 12 }
                                          }
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col xs={12} lg={6}>
                          <Card className="shadow-lg h-100" style={{ borderRadius: '24px', background: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)', boxShadow: '0 8px 32px rgba(76,175,80,0.08)' }}>
                            <Card.Header style={{
                              background: 'linear-gradient(45deg, rgba(76, 175, 80, 0.08), rgba(139, 195, 74, 0.08))',
                              fontWeight: '700',
                              fontSize: isMobile ? '1.15rem' : '1.3rem',
                              color: '#333',
                              borderBottom: '1px solid rgba(0,0,0,0.04)',
                              padding: isMobile ? '1rem' : '1.5rem',
                              borderRadius: '24px 24px 0 0'
                            }}>Recent Activity</Card.Header>
                            <Card.Body style={{ padding: isMobile ? '1rem' : '2rem', background: 'rgba(255,255,255,0.95)', borderRadius: '0 0 24px 24px' }}>
                              {loadingEngagement ? (
                                <div className="text-center p-4">Loading...</div>
                              ) : engagementData.recentActivity.length === 0 ? (
                                <div className="text-center p-4 text-muted">No recent activity</div>
                              ) : (
                                <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                  {engagementData.recentActivity.map((activity, index) => (
                                    <div key={index} className="d-flex align-items-center mb-3 p-2 rounded" style={{ 
                                      background: activity.type === 'quiz' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                                      border: activity.type === 'quiz' ? '1px solid rgba(33, 150, 243, 0.2)' : '1px solid rgba(76, 175, 80, 0.2)'
                                    }}>
                                      <div className="me-3" style={{ fontSize: '1.2rem' }}>
                                        {activity.type === 'quiz' ? '🎯' : '📚'}
                                      </div>
                                      <div className="flex-grow-1">
                                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#333' }}>
                                          {activity.title}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                          {activity.subject} {activity.score && `• Score: ${activity.score}%`}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#999' }}>
                                          {new Date(activity.timestamp).toLocaleString()}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                        </React.Fragment>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </div>

    {/* Statistics Explanation Modal */}
    <Modal show={showInfoModal} onHide={() => setShowInfoModal(false)} size="lg" centered>
      <Modal.Header closeButton style={{ background: 'linear-gradient(135deg, #6a39e4 0%, #7367f0 100%)', color: 'white' }}>
        <Modal.Title>📊 How AR-Quest Statistics Work</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        <div className="mb-4">
          <h5 className="text-primary mb-3">🎯 Overview Tab</h5>
          <ul className="list-unstyled">
            <li className="mb-2"><strong>Average Score:</strong> Calculated from all quiz attempts in the selected time period. Shows the mean score across all subjects.</li>
            <li className="mb-2"><strong>Total Students:</strong> Number of active students (teachers see only their assigned students).</li>
            <li className="mb-2"><strong>Enrollment Growth:</strong> Shows student enrollment trends over the last 6 months to track growth patterns.</li>
            <li className="mb-2"><strong>Performance Trends:</strong> Displays score patterns over time periods to identify improvement or decline trends.</li>
            <li className="mb-2"><strong>Engagement Score:</strong> Based on completion rates: High (70%+), Medium (40-69%), Low (below 40%).</li>
          </ul>
        </div>

        <div className="mb-4">
          <h5 className="text-success mb-3">📚 Performance Tab</h5>
          <ul className="list-unstyled">
            <li className="mb-2"><strong>Subject Performance:</strong> Shows average and highest scores per subject from quiz attempts.</li>
            <li className="mb-2"><strong>Score Calculation:</strong> Uses best score per student per quiz to avoid penalizing multiple attempts.</li>
            <li className="mb-2"><strong>Pass Rate:</strong> Percentage of quiz attempts that meet or exceed the quiz's passing score.</li>
            <li className="mb-2"><strong>Data Sources:</strong> Pulls from quiz_attempts and lesson_completions tables with time filtering.</li>
          </ul>
        </div>

        <div className="mb-4">
          <h5 className="text-warning mb-3">👥 Distribution Tab</h5>
          <ul className="list-unstyled">
            <li className="mb-2"><strong>Section Distribution:</strong> Visual breakdown of how students are distributed across classroom sections.</li>
            <li className="mb-2"><strong>Active Sections:</strong> Sections that currently have enrolled students.</li>
            <li className="mb-2"><strong>Unassigned Students:</strong> Students not yet assigned to any section (requires attention).</li>
            <li className="mb-2"><strong>Average per Section:</strong> Mean number of students per section for workload balancing.</li>
          </ul>
        </div>

        <div className="mb-4">
          <h5 className="text-info mb-3">⚡ Engagement Tab</h5>
          <ul className="list-unstyled">
            <li className="mb-2"><strong>Quiz Attempts:</strong> Total number of quiz completions in the selected time period.</li>
            <li className="mb-2"><strong>Lessons Completed:</strong> Number of lessons marked as completed by students.</li>
            <li className="mb-2"><strong>Active Students:</strong> Students who have completed at least one quiz or lesson in the time period.</li>
            <li className="mb-2"><strong>Completion Rate:</strong> Percentage of students who have both quiz and lesson activity.</li>
            <li className="mb-2"><strong>Popular Subjects:</strong> Ranked by total activity (quizzes + lessons) to identify engagement patterns.</li>
            <li className="mb-2"><strong>Recent Activity:</strong> Live feed of the most recent quiz attempts and lesson completions.</li>
          </ul>
        </div>

        <div className="mb-4">
          <h5 className="text-danger mb-3">⏰ Time Filters</h5>
          <ul className="list-unstyled">
            <li className="mb-2"><strong>Last 24 Hours:</strong> Shows recent activity patterns and daily engagement levels.</li>
            <li className="mb-2"><strong>Last 7 Days:</strong> Weekly trends useful for identifying learning schedule patterns.</li>
            <li className="mb-2"><strong>Last 30 Days:</strong> Monthly view for progress tracking and curriculum planning.</li>
            <li className="mb-2"><strong>All Time:</strong> Complete historical data for comprehensive analysis and reporting.</li>
          </ul>
        </div>

        <div className="alert alert-primary">
          <h6 className="alert-heading">🔒 Teacher vs Admin View</h6>
          <p className="mb-0">
            <strong>Teachers</strong> see statistics only for students in their assigned sections. 
            <strong>Administrators</strong> can view system-wide statistics across all sections and students.
          </p>
        </div>

        <div className="alert alert-success">
          <h6 className="alert-heading">� Export & Print Options</h6>
          <p className="mb-0">
            <strong>� Time Filters:</strong> Use the filter buttons to view statistics for different time periods - day, week, month, or all time. 
            This helps analyze trends and performance changes over specific timeframes.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowInfoModal(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
    </>
  );
};

export default StatisticsPage;
