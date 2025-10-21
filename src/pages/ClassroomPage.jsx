import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Form,
  Alert,
  Modal,
  Nav,
  InputGroup,
  ButtonGroup
  , Dropdown
} from "react-bootstrap";
import {
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiUsers,
  FiAlertCircle,
  FiDownload,
  FiX,
  FiTrendingUp,
  FiMail,
  FiPhone
} from "react-icons/fi";
import { FaGraduationCap, FaChalkboardTeacher, FaBookReader, FaStar } from 'react-icons/fa';
import languageImg from '../Subject_image/Language.png';
import gmrcImg from '../Subject_image/GMRC.png';
import mathImg from '../Subject_image/Mathemathics.png';
import makabansaImg from '../Subject_image/Makabansa.png';
import environmentImg from '../Subject_image/Physical & Natural Environment.png';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import SideMenu from "../components/SideMenu";
import { colors } from "../styles/constants";
import { supabase, supabaseAdmin, createSignedUrl } from "../config/supabase";

// Kid-friendly styles
const kidStyles = {
  colors: {
    primary: '#4285F4',     // Bright blue
    secondary: '#34A853',   // Green
    accent1: '#FBBC05',     // Yellow
    accent2: '#EA4335',     // Red
    accent3: '#9C27B0',     // Purple
    background: '#F8F9FA',  // Light gray
    cardBg: '#FFFFFF',      // White
    text: '#333333',        // Dark gray
  },
  container: {
    background: 'linear-gradient(135deg, #f5f7ff 0%, #fff 100%)',
    minHeight: '100vh',
    padding: '20px',
  },
  card: {
    borderRadius: '20px',
    border: 'none',
    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s ease-in-out',
    background: '#ffffff',
    '&:hover': {
      transform: 'translateY(-5px)',
    }
  },
  button: {
    borderRadius: '15px',
    padding: '10px 20px',
    fontWeight: '600',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  searchBar: {
    borderRadius: '20px',
    border: '2px solid #e0e6ff',
    padding: '12px 20px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
    width: '100%',
    maxWidth: '100%',
    marginBottom: window.innerWidth <= 768 ? '10px' : '0',
  },  table: {
    borderRadius: '15px',
    overflow: 'hidden',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
  },  scrollbar: {
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(66, 133, 244, 0.2) rgba(0,0,0,0.03)',
    msOverflowStyle: 'auto'
  },
  sectionCard: {
    background: '#fff',
    borderRadius: '15px',
    padding: '15px',
    margin: '10px 0',
    border: '2px solid #e0e6ff',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
      transform: 'scale(1.02)',
      boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
    }
  },
  heading: {
    color: '#4a4a8a',
    fontWeight: '700',
    marginBottom: '20px',
    fontSize: '1.8rem',
  }
};

// Decorative component for visual appeal
const DecorativeElement = ({ type }) => {
  const style = {
    position: 'absolute',
    width: '40px',
    height: '40px',
    opacity: '0.1',
    transform: 'rotate(45deg)',
    pointerEvents: 'none',
  };

  return (
    <div style={{
      ...style,
      background: type === 'star' ? '#FFD700' : '#4a90e2',
      clipPath: type === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : 'none',
      borderRadius: type === 'circle' ? '50%' : '0',
    }} />
  );
};

const ClassroomPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("students");
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  // Center-top toast state for consistent notifications
  const [showClassToast, setShowClassToast] = useState(false);
  const [classToastType, setClassToastType] = useState('success');
  const [classToastMessage, setClassToastMessage] = useState('');
  const [classToastEntity, setClassToastEntity] = useState('Notification');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [modalMode, setModalMode] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState({ type: "success", message: "" });
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedSection, setSelectedSection] = useState("all");
  const [printModalSection, setPrintModalSection] = useState("all");
  const [downloadType, setDownloadType] = useState("pdf");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const pdfContentRef = useRef(null);
  const userRole = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");
  const subjects = [
    'Language',
    'Mathematics',
    'GMRC',
    'Makabansa',
    'Physical & Natural Environment'
  ];
  const subjectImages = {
    Mathematics: mathImg,
    Language: languageImg,
    GMRC: gmrcImg,
    Makabansa: makabansaImg,
    'Physical & Natural Environment': environmentImg
  };
  const [studentProgress, setStudentProgress] = useState({});
  const [progressLoading, setProgressLoading] = useState(false);
  
  // Bulk selection state
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  // Bulk move modal state
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [bulkMoveTargetSection, setBulkMoveTargetSection] = useState(null);
  const [bulkMoveTargetName, setBulkMoveTargetName] = useState('');
  const [bulkMoveInProgress, setBulkMoveInProgress] = useState(false);
  const [bulkMoveHover, setBulkMoveHover] = useState(false);
  const [cancelHover, setCancelHover] = useState(false);
  
  // Derived parent info for the selected student (alias from the students query)
  const parentInfo = selectedStudent?.user_profiles || selectedStudent?.parent || null;
  const [parentAvatarUrl, setParentAvatarUrl] = useState(null);

  // Resolve parent avatar to a usable URL (using ProfilePage pattern)
  useEffect(() => {
    let mounted = true;
    const resolveAvatar = async () => {
      setParentAvatarUrl(null);
      try {
        if (!parentInfo || !parentInfo.profile_picture_url) return;
        
        // Use the exact same pattern as ProfilePage.jsx
        if (/^https?:\/\//i.test(parentInfo.profile_picture_url)) {
          if (mounted) setParentAvatarUrl(parentInfo.profile_picture_url);
        } else {
          const signed = await createSignedUrl('profile-pictures', parentInfo.profile_picture_url, 60 * 60);
          if (mounted) setParentAvatarUrl(signed || parentInfo.profile_picture_url);
        }
      } catch (err) {
        if (mounted) setParentAvatarUrl(parentInfo.profile_picture_url);
      }
    };
    resolveAvatar();
    return () => { mounted = false; };
  }, [parentInfo]);

  const [studentAvatarUrl, setStudentAvatarUrl] = useState(null);
  useEffect(() => {
    let mounted = true;
    const resolveStudentAvatar = async () => {
      setStudentAvatarUrl(null);
      try {
        if (!selectedStudent || !selectedStudent.profile_picture_url) return;
        
        // Use the exact same pattern as ProfilePage.jsx
        if (/^https?:\/\//i.test(selectedStudent.profile_picture_url)) {
          if (mounted) setStudentAvatarUrl(selectedStudent.profile_picture_url);
        } else {
          const signed = await createSignedUrl('profile-pictures', selectedStudent.profile_picture_url, 60 * 60);
          if (mounted) setStudentAvatarUrl(signed || selectedStudent.profile_picture_url);
        }
      } catch (err) {
        if (mounted) setStudentAvatarUrl(selectedStudent.profile_picture_url);
      }
    };
    resolveStudentAvatar();
    return () => { mounted = false; };
  }, [selectedStudent]);

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    // Redirect students to home page if they try to access classroom
    if (userRole === "user") {
      navigate("/home");
      return;
    }
    fetchData();
  }, [navigate]);

  // Set selectedSection to teacher's assigned section when teachers data is loaded
  useEffect(() => {
    if (userRole === "teacher" && teachers.length > 0) {
      // Try both uid and id to match the teacher
      const currentTeacher = teachers.find(t => t.uid === userId || t.id === userId);
      
      if (currentTeacher && currentTeacher.section_name) {
        setSelectedSection(currentTeacher.section_name);
      } else if (currentTeacher && currentTeacher.assignedSectionName) {
        setSelectedSection(currentTeacher.assignedSectionName);
      }
    }
  }, [teachers, userRole, userId]);

  // Mobile detection resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Real-time subscription for teacher section assignments
  useEffect(() => {
    if (!userId || userRole !== "teacher") return;


    // Subscribe to changes in sections table (when teacher_id is updated)
    const sectionsSubscription = supabase
      .channel('sections_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sections',
          filter: `teacher_id=eq.${userId}`
        },
        (payload) => {
          // Refresh data to get updated section assignment
          fetchData();
        }
      )
      .subscribe((status) => {
      });

    // Subscribe to changes in user_profiles table (when section_id is updated)
    const profilesSubscription = supabase
      .channel('profiles_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          // Refresh data to get updated section assignment
          fetchData();
        }
      )
      .subscribe((status) => {
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
            fetchData();
          }
        }
      )
      .subscribe((status) => {
      });

    // Cleanup subscriptions on unmount
    return () => {
      sectionsSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
      allSectionsSubscription.unsubscribe();
    };
  }, [userId, userRole]);

  const fetchData = async () => {
    try {
      // Fetch sections with teacher info
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('sections')
        .select(`id, name, time_period, classroom_number, teacher_id, max_students, school_year, is_active, created_at, user_profiles(id, first_name, last_name, profile_picture_url)`) // join teacher info
        .order('name', { ascending: true });
      if (sectionsError) throw sectionsError;

      // Fetch students with parent info and section info
      // If the current user is a teacher, only fetch students in sections assigned to them
      let studentsQuery = supabase
        .from('students')
        .select(`id, parent_id, section_id, first_name, last_name, date_of_birth, student_id, profile_picture_url, enrollment_date, is_active, created_at, user_profiles:parent_id(id, first_name, last_name, profile_picture_url, email, contact), section:sections(id, name)`) // join parent and section with correct alias
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

      if (userRole === 'teacher') {
        try {
          // Find all sections assigned to this teacher
          const { data: teacherSections, error: teacherSectionsErr } = await supabase
            .from('sections')
            .select('id')
            .eq('teacher_id', userId);
          if (teacherSectionsErr) throw teacherSectionsErr;
          const sectionIds = (teacherSections || []).map(s => s.id).filter(Boolean);
          if (sectionIds.length > 0) {
            studentsQuery = studentsQuery.in('section_id', sectionIds);
          } else {
            // Teacher has no assigned sections - set query to return empty set
            studentsQuery = studentsQuery.eq('id', ''); // no match
          }
        } catch (err) {
        }
      }

      const { data: studentsData, error: studentsError } = await studentsQuery;
      if (studentsError) throw studentsError;

      // Fetch teachers from user_profiles
      const { data: teachersData, error: teachersError } = await supabase
        .from('user_profiles')
        .select('id, role, username, first_name, last_name, profile_picture_url, is_active, created_at')
        .eq('role', 'teacher')
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });
      if (teachersError) throw teachersError;

      // Count students per section
      const sectionCounts = {};
      (studentsData || []).forEach(student => {
        if (student.section_id) {
          sectionCounts[student.section_id] = (sectionCounts[student.section_id] || 0) + 1;
        }
      });

      // Prepare sections data with counts
      const processedSections = (sectionsData || []).map(section => ({
        ...section,
        student_count: sectionCounts[section.id] || 0
      }));

      setSections(processedSections);
      setStudents(studentsData || []);
      
      // Attach assigned section name to each teacher for display
      const teachersWithSection = (teachersData || []).map(teacher => {
        const assignedSection = processedSections.find(s => s.teacher_id === teacher.id);
        return {
          ...teacher,
          assignedSectionName: assignedSection ? assignedSection.name : null
        };
      });
      setTeachers(teachersWithSection);

    } catch (error) {
      showAlertMessage("danger", error.message || error.details || "Failed to fetch data");
    }
  };

  const handleShowModal = (mode, item = null) => {
    setModalMode(mode);
    if (item) {
      // Add necessary information to the selected item
      const enrichedItem = {
        ...item,
        isTeacher: activeTab === 'teachers',
        currentSection: item.section_name || null,
        // Ensure we have the correct type flag for the assignment
        type: activeTab === 'teachers' ? 'teacher' : 'student'
      };
      setSelectedItem(enrichedItem);
    } else {
      setSelectedItem(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    // Only hide the modal, don't clear data immediately (prevents form flash)
    setShowModal(false);
    // Don't clear modalMode and selectedItem here - let onExited handle it
  };

  const handleModalExited = () => {
    // Clear modal data only after animation completes
    setModalMode("");
    setSelectedItem(null);
  };

  const showAlertMessage = (type, message) => {
    const toastType = (type === 'danger' || type === 'warning') ? 'danger' : 'success';
    setClassToastType(toastType);
    setClassToastMessage(message);
    setClassToastEntity('Notification');
    setShowClassToast(true);
  };

  // Auto-hide classroom toast after 3s
  useEffect(() => {
    if (!showClassToast) return undefined;
    const id = setTimeout(() => setShowClassToast(false), 3000);
    return () => clearTimeout(id);
  }, [showClassToast]);

  const handleSectionAction = async (action, data) => {
    try {
      let error;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      switch (action) {
        case "create":
          const { error: createError } = await supabaseAdmin
            .from('sections')
            .insert([{
              name: data.section_name,
              classroom_number: data.classroom_number,
              time_period: data.time_period,
              max_students: data.max_students,
              school_year: data.school_year,
              is_active: true
            }]);
          if (createError) throw createError;
          break;
        case "update":
          const { error: updateError } = await supabaseAdmin
            .from('sections')
            .update({ 
              name: data.new_section_name,
              classroom_number: data.classroom_number,
              time_period: data.time_period,
              max_students: data.max_students,
              school_year: data.school_year
            })
            .eq('name', data.old_section_name);
          if (updateError) throw updateError;
          break;
        case "delete":
          const { error: deleteError } = await supabaseAdmin
            .from('sections')
            .delete()
            .eq('name', data.section_name);
          if (deleteError) throw deleteError;
          break;
        case "assign":
          
          if (data.type === 'teacher') {
            // First, unassign teacher from any previous sections
            const { error: unassignError } = await supabaseAdmin
              .from('sections')
              .update({ teacher_id: null })
              .eq('teacher_id', data.teacher_id);
            if (unassignError) {
              throw unassignError;
            }

            // Then assign teacher to the new section
            const { error: assignError, data: updateResult } = await supabaseAdmin
              .from('sections')
              .update({ teacher_id: data.teacher_id })
              .eq('id', data.section_id)
              .select();
              
            if (assignError) {
              throw assignError;
            }
            
          } else if (data.type === 'student') {
            // Assign student to section by updating section_id in students table
            const { error: studentAssignError } = await supabaseAdmin
              .from('students')
              .update({ section_id: data.section_id })
              .eq('id', data.student_id);
            if (studentAssignError) throw studentAssignError;
          }
          break;
      }

      if (error) {
        let message = error.message;
        if (error.code === '23503') { // Foreign key violation
          message = 'Cannot modify section: it is being used by one or more students';
        } else if (error.code === '23505') { // Unique violation
          message = 'A section with this name already exists';
        }
        throw new Error(message);
      }
      
      // Show appropriate success message
      let successMessage;
      switch (action) {
        case "create":
          successMessage = "Section created successfully";
          break;
        case "update":
          successMessage = "Section updated successfully";
          break;
        case "delete":
          successMessage = "Section deleted successfully";
          break;
        case "assign":
          successMessage = data.type === 'teacher' ? "Teacher assigned to section successfully" : "Student assigned to section successfully";
          break;
        default:
          successMessage = "Operation completed successfully";
      }
      showAlertMessage("success", successMessage);
      
      // Refresh data to show updated sections
      fetchData();
      handleCloseModal();
    } catch (error) {
      showAlertMessage("danger", error.message || "Operation failed");
    }
    handleCloseModal();
    await fetchData();
  };  const filteredTeachers = React.useMemo(() => {
    return teachers.filter(teacher => {
      const matchesSearch = searchTerm === '' || 
        `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.username.toLowerCase().includes(searchTerm.toLowerCase());
      // Teachers are not assigned to sections directly in the new schema, so only filter by search
      return matchesSearch;
    });
  }, [teachers, searchTerm]);

  const filteredStudents = React.useMemo(() => {
    // Get the current user's student entry
    const currentUser = students.find(s => s.id === userId);
    const currentUserSection = userRole === "student" ? currentUser?.section_id : null;

    return students.filter(student => {
      try {
        // Search filter
        const matchesSearch = searchTerm === '' || 
          (`${student.first_name || ''} ${student.last_name || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase())) ||
          ((student.student_id || '').toLowerCase().includes((searchTerm || '').toLowerCase()));

        // Section filter based on user role and selected section
        let matchesSection;
        if (userRole === "admin" || userRole === "teacher") {
          matchesSection = selectedSection === 'all' || 
            (selectedSection === 'unassigned' && !student.section_id) ||
            (student.sections?.name === selectedSection);
        } else {
          // Students only see their own section
          if (currentUser?.section_id) {
            matchesSection = student.section_id === currentUser.section_id;
          } else {
            matchesSection = !student.section_id || student.id === userId;
          }
          if (student.id === userId) {
            matchesSection = true;
          }
        }
        return matchesSearch && matchesSection;
      } catch (e) {
        // Prevent crash if any error occurs
        return false;
      }
    });
  }, [students, searchTerm, selectedSection, userRole, userId]);

  const printFilteredStudents = React.useMemo(() => {
    return students.filter(student => {
      const matchesSearch = searchTerm === '' || 
        (`${student.first_name || ''} ${student.last_name || ''}`.toLowerCase().includes(searchTerm?.toLowerCase?.() || '')) ||
        (student.student_id?.toLowerCase?.().includes(searchTerm?.toLowerCase?.() || ''));

      let matchesSection;
      if (userRole === "teacher") {
        // For teachers, only show students in their assigned section
        const teacherSection = teachers.find(t => t.uid === userId || t.id === userId)?.assignedSectionName;
        matchesSection = student.section?.name === teacherSection;
      } else {
        // For admin, follow the print modal section filter
        matchesSection = printModalSection === 'all' || 
          (printModalSection === 'unassigned' && !student.section?.name) ||
          (student.section?.name === printModalSection);
      }

      return matchesSearch && matchesSection;
    });
  }, [students, searchTerm, printModalSection, userRole, userId, teachers]);

  const filteredSections = React.useMemo(() => {
    const term = (searchTerm || '').toLowerCase();
    if (!term) return sections;
    return sections.filter(s => {
      const name = (s.name || '').toLowerCase();
      const classroom = (s.classroom_number || '').toString().toLowerCase();
      const teacherName = ((s.user_profiles && `${s.user_profiles.first_name || ''} ${s.user_profiles.last_name || ''}`) || '').toLowerCase();
      return name.includes(term) || classroom.includes(term) || teacherName.includes(term);
    });
  }, [sections, searchTerm]);

  const canManageSections = userRole === "admin" || userRole === "teacher";
  
  // Bulk selection handlers
  const handleSelectStudent = (studentId, isChecked) => {
    const newSelected = new Set(selectedStudents);
    if (isChecked) {
      newSelected.add(studentId);
    } else {
      newSelected.delete(studentId);
    }
    setSelectedStudents(newSelected);
    
    // Update select-all state
    const visibleStudents = getVisibleStudents();
    setSelectAll(visibleStudents.length > 0 && visibleStudents.every(s => newSelected.has(s.id)));
  };

  const handleSelectAll = (isChecked) => {
    const visibleStudents = getVisibleStudents();
    const newSelected = new Set(selectedStudents);
    
    if (isChecked) {
      visibleStudents.forEach(student => newSelected.add(student.id));
    } else {
      visibleStudents.forEach(student => newSelected.delete(student.id));
    }
    
    setSelectedStudents(newSelected);
    setSelectAll(isChecked);
  };

  const getVisibleStudents = () => {
    return [...students].filter(student => {
      // Same filtering logic as in the table
      const matchesSearch = searchTerm === '' || 
        (`${student.first_name || student.firstname || ''} ${student.last_name || student.lastname || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase())) ||
        ((student.student_id || '').toLowerCase().includes((searchTerm || '').toLowerCase())) ||
        ((student.emailaddress || student.email || '').toLowerCase().includes((searchTerm || '').toLowerCase()));

      let matchesSection = true;
      if (userRole === "teacher") {
        const currentTeacher = teachers.find(t => t.uid === userId || t.id === userId);
        const teacherSection = currentTeacher?.section_name || currentTeacher?.assignedSectionName;
        matchesSection = teacherSection ? 
          (student.section_name === teacherSection || student.section?.name === teacherSection) : 
          false;
      } else if (userRole === "admin") {
        matchesSection = selectedSection === 'all' || 
          (selectedSection === 'unassigned' && !student.section_name && !student.section?.name) ||
          (student.section_name === selectedSection || student.section?.name === selectedSection);
      }
      
      return matchesSearch && matchesSection;
    });
  };

  const handleRowClick = (user) => {
    // Allow viewing for all users, but keep management functions restricted
    setSelectedStudent(user);
    setShowCredentialsModal(true);
    setSelectedItem(user); // This ensures the modal has the correct data for section assignment
  };

  // Bulk operations
  const handleBulkDelete = async () => {
    if (selectedStudents.size === 0) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete ${selectedStudents.size} selected student(s)? This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      const studentIds = Array.from(selectedStudents);
      const { error } = await supabaseAdmin
        .from('students')
        .delete()
        .in('id', studentIds);
        
      if (error) throw error;
      
      alert(`Successfully deleted ${studentIds.length} student(s)`);
      setSelectedStudents(new Set());
      setSelectAll(false);
      fetchData(); // Refresh the data
    } catch (error) {
      alert('Failed to delete students: ' + error.message);
    }
  };

  const handleBulkSectionChange = async (newSectionId) => {
    if (selectedStudents.size === 0) return;
    const sectionName = newSectionId === 'unassign' ? 'Unassigned' : sections.find(s => s.id === newSectionId)?.name || 'Unknown Section';
    // Open confirmation modal
    setBulkMoveTargetSection(newSectionId);
    setBulkMoveTargetName(sectionName);
    setShowBulkMoveModal(true);
  };

  const performBulkSectionChange = async () => {
    if (!bulkMoveTargetSection) return;
    setBulkMoveInProgress(true);
    try {
      const studentIds = Array.from(selectedStudents);
      const updateData = bulkMoveTargetSection === 'unassign' ? { section_id: null } : { section_id: bulkMoveTargetSection };
      const { error } = await supabaseAdmin
        .from('students')
        .update(updateData)
        .in('id', studentIds);
      if (error) throw error;
      // Success
      setShowBulkMoveModal(false);
      setSelectedStudents(new Set());
      setSelectAll(false);
      fetchData();
      setBulkMoveTargetSection(null);
      setBulkMoveTargetName('');
    } catch (err) {
      alert('Failed to move students: ' + (err.message || 'Unknown error'));
    } finally {
      setBulkMoveInProgress(false);
    }
  };
  
  const generatePDF = async () => {
    try {
      setIsGeneratingPdf(true);
        const sectionName = printModalSection === "all" 
        ? "All_Sections" 
        : printModalSection === "unassigned"
          ? "Unassigned"
          : sections.find(s => s.section_id === printModalSection)?.section_name.replace(/\s+/g, '_') || "Unknown_Section";
      
      const pdfContent = document.createElement('div');
      pdfContent.style.padding = '20px';
      pdfContent.style.fontFamily = 'Arial, sans-serif';
      pdfContent.style.width = '100%';
      pdfContent.style.maxWidth = '800px';
      
      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '20px';
      
      const logoImg = new Image();
      logoImg.src = `${window.location.origin}/images/logo.png`;
      logoImg.style.height = '60px';
      
      await new Promise((resolve) => {
        logoImg.onload = resolve;
        logoImg.onerror = resolve;
      });
      
      const headerLeft = document.createElement('div');
      headerLeft.appendChild(logoImg);
      
      const headerRight = document.createElement('div');
      headerRight.style.textAlign = 'right';
      
      const title = document.createElement('h2');
      title.textContent = 'Student List';
      title.style.marginBottom = '5px';
      
      const sectionText = document.createElement('p');      sectionText.textContent = `Section: ${printModalSection === "all" 
        ? "All Sections" 
        : printModalSection === "unassigned"
          ? "Unassigned"
          : sections.find(s => s.section_id === printModalSection)?.section_name || "Unknown Section"}`;
      sectionText.style.margin = '0';
      
      const dateText = document.createElement('p');
      dateText.textContent = `Date: ${new Date().toLocaleDateString()}`;
      dateText.style.margin = '0';
      
      headerRight.appendChild(title);
      headerRight.appendChild(sectionText);
      headerRight.appendChild(dateText);
      
      header.appendChild(headerLeft);
      header.appendChild(headerRight);
      pdfContent.appendChild(header);
      
      const tableContainer = document.createElement('div');
      tableContainer.style.overflowX = 'auto';
      
      const originalTable = document.querySelector('#print-content table');
      let tableClone;
      if (originalTable) {
        tableClone = originalTable.cloneNode(true);
      } else {
        // Fallback: build a simple table from printFilteredStudents data
        tableClone = document.createElement('table');
        tableClone.style.width = '100%';
        const thead = document.createElement('thead');
        const htr = document.createElement('tr');
        ['ID', 'Student Name', 'Section'].forEach(h => {
          const th = document.createElement('th');
          th.textContent = h;
          th.style.padding = '8px';
          th.style.textAlign = 'left';
          htr.appendChild(th);
        });
        thead.appendChild(htr);
        tableClone.appendChild(thead);
        const tbody = document.createElement('tbody');
        (printFilteredStudents || []).forEach(student => {
          const tr = document.createElement('tr');
          const tdId = document.createElement('td'); tdId.textContent = student.student_id || 'N/A'; tdId.style.padding = '8px'; tr.appendChild(tdId);
          const tdName = document.createElement('td'); tdName.textContent = (student.first_name || '') + (student.last_name ? ' ' + student.last_name : ''); tdName.style.padding = '8px'; tr.appendChild(tdName);
          const tdSection = document.createElement('td'); tdSection.textContent = student.section?.name || student.section_name || 'Unassigned'; tdSection.style.padding = '8px'; tr.appendChild(tdSection);
          tbody.appendChild(tr);
        });
        tableClone.appendChild(tbody);
      }
      
      tableClone.style.width = '100%';
      tableClone.style.borderCollapse = 'collapse';
      tableClone.style.marginBottom = '20px';
      
      const allThCells = tableClone.querySelectorAll('th');
      const allTdCells = tableClone.querySelectorAll('td');
      
      allThCells.forEach(cell => {
        cell.style.backgroundColor = '#f2f2f2';
        cell.style.border = '1px solid #ddd';
        cell.style.padding = '8px';
        cell.style.textAlign = 'left';
        cell.style.fontWeight = 'bold';
      });
      
      allTdCells.forEach(cell => {
        cell.style.border = '1px solid #ddd';
        cell.style.padding = '8px';
        cell.style.textAlign = 'left';
      });
      
      tableContainer.appendChild(tableClone);
      pdfContent.appendChild(tableContainer);
      
      const summary = document.createElement('div');
      summary.style.marginTop = '20px';
        const totalStudents = document.createElement('p');
      totalStudents.innerHTML = `<strong>Total Students:</strong> ${printFilteredStudents.length}`;
      summary.appendChild(totalStudents);
      
      pdfContent.appendChild(summary);
      
      const footer = document.createElement('div');
      footer.style.marginTop = '30px';
      footer.style.textAlign = 'center';
      footer.style.fontSize = '12px';
      footer.style.color = '#666';
      
      const footerText = document.createElement('p');
      footerText.textContent = `AugmentED Learning System - Generated on ${new Date().toLocaleString()}`;
      footer.appendChild(footerText);
      
      pdfContent.appendChild(footer);
      
      document.body.appendChild(pdfContent);
      
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      pdf.save(`Student_List_${sectionName}_${new Date().toISOString().slice(0,10)}.pdf`);
      
      document.body.removeChild(pdfContent);
      showAlertMessage("success", "PDF Downloaded Successfully");
    } catch (err) {
      showAlertMessage("danger", "Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  const exportToCSV = () => {
    let csvContent = "ID,Student Name,Section\n";
    printFilteredStudents.forEach((student, index) => {
      const name = (student.first_name && student.last_name)
        ? `${student.first_name} ${student.last_name}`
        : 'No Name';
      const row = [
        student.student_id || 'N/A',
        name,
        (student.section?.name || student.section_name || 'Unassigned')
      ];
      const escapedRow = row.map(field => {
        if (field && typeof field === 'string' && field.includes(',')) {
          return `"${field}"`;
        }
        return field;
      });
      csvContent += escapedRow.join(",") + "\n";
    });
    
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `student-list-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    
    showAlertMessage("success", "CSV Downloaded Successfully");
  };
  const handleDownload = () => {
    if (downloadType === "pdf") {
      generatePDF();
    } else {
      exportToCSV();
    }
  };

  const mainContentStyle = {
    marginLeft: !isMobile ? '220px' : '0',
    width: !isMobile ? 'calc(100% - 236px)' : '100%',
    height: '100vh',
    padding: !isMobile ? '16px' : '8px',
    paddingTop: isMobile ? '60px' : '16px', // Add top padding for mobile hamburger menu
    position: 'fixed',
    top: '0',
    right: !isMobile ? '16px' : '0',
    overflowY: 'auto',
    transition: 'all 0.3s ease',
    backgroundColor: 'transparent'
  };
  const cardStyle = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
    background: kidStyles.colors.cardBg,
    overflow: 'hidden',
    borderRadius: '24px',
    border: 'none'
  };
  
  return (
    <>
      <style>
        {`
          @media (max-width: 768px) {
            .classroom-mobile-card .card {
              margin: 0.25rem !important;
              border-radius: 12px !important;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
            }
            .classroom-mobile-card .card-body {
              padding: 0.5rem !important;
            }
            .classroom-mobile-table {
              font-size: 0.7rem !important;
              overflow-x: auto !important;
            }
            .classroom-mobile-table th,
            .classroom-mobile-table td {
              padding: 0.25rem 0.1rem !important;
              font-size: 0.65rem !important;
              white-space: nowrap !important;
              border: none !important;
            }
            .classroom-mobile-table th {
              background-color: #f8f9fa !important;
              font-weight: 600 !important;
            }
            .classroom-mobile-nav {
              padding: 0.5rem !important;
            }
            .classroom-mobile-nav .nav-link {
              font-size: 0.75rem !important;
              padding: 0.4rem 0.6rem !important;
              border-radius: 8px !important;
            }
            .classroom-mobile-btn {
              font-size: 0.7rem !important;
              padding: 0.25rem 0.5rem !important;
              border-radius: 6px !important;
            }
            .classroom-mobile-search {
              margin-bottom: 0.75rem !important;
            }
            .classroom-mobile-search .form-control {
              font-size: 0.8rem !important;
              padding: 0.5rem !important;
            }
            .classroom-mobile-filters {
              flex-direction: column !important;
              gap: 0.5rem !important;
            }
            .classroom-mobile-filters .btn-group {
              flex-wrap: wrap !important;
            }
            .classroom-mobile-header {
              text-align: center !important;
              margin-bottom: 1rem !important;
              padding: 0.5rem !important;
            }
            .classroom-mobile-header h4 {
              font-size: 1.1rem !important;
              margin-bottom: 0.25rem !important;
            }
            .classroom-mobile-header p {
              font-size: 0.8rem !important;
              margin-bottom: 0 !important;
            }
            .classroom-mobile-stats {
              flex-direction: column !important;
              gap: 0.5rem !important;
            }
            .classroom-mobile-stats .col-md-3 {
              margin-bottom: 0.5rem !important;
            }
            .classroom-mobile-stats .card {
              padding: 0.5rem !important;
              margin: 0.25rem 0 !important;
            }
            .classroom-mobile-content {
              max-height: calc(100vh - 120px) !important;
              overflow-y: auto !important;
            }
            .classroom-mobile-tab-content {
              padding: 0.5rem !important;
            }
            .classroom-mobile-section-filter {
              margin-bottom: 0.75rem !important;
            }
            .classroom-mobile-section-filter .form-select {
              font-size: 0.8rem !important;
              padding: 0.5rem !important;
            }
            .classroom-mobile-action-buttons {
              flex-direction: column !important;
              gap: 0.5rem !important;
              margin-bottom: 1rem !important;
            }
            .classroom-mobile-action-buttons .btn {
              width: 100% !important;
              font-size: 0.8rem !important;
            }
            /* Make table scrollable horizontally */
            .table-responsive {
              border: none !important;
              font-size: 0.7rem !important;
            }
            .table-responsive table {
              min-width: 600px !important;
            }
          }
        `}
      </style>
    <div className="d-flex min-vh-100" style={{
      background: '#fff',
      position: "relative"
    }}>
      <SideMenu selectedItem="Classroom" isModalOpen={showModal || showCredentialsModal || showPrintModal} />
      <div style={mainContentStyle}>
        <Container fluid className="h-100">
          <Card style={cardStyle} className={isMobile ? 'classroom-mobile-card' : ''}>
            <Card.Body className="p-0">
              {/* Inline alert removed — classroom notifications show via center-top toast */}
              {/* Classroom center-top toast */}
              <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', top: isMobile ? '64px' : '24px', zIndex: 9999 }}>
                <div style={{ display: showClassToast ? 'block' : 'none', minWidth: 220, maxWidth: 560 }}>
                  <div style={{
                    background: classToastType === 'success' ? '#ecfdf5' : '#fff5f5',
                    border: `1px solid ${classToastType === 'success' ? '#bbf7d0' : '#fecaca'}`,
                    padding: '10px 14px',
                    borderRadius: 12,
                    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'center'
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: classToastType === 'success' ? '#10b981' : '#ef4444', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{classToastType === 'success' ? '✓' : '!'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{classToastEntity}</div>
                      <div style={{ color: '#475569', fontSize: '0.85rem' }}>{classToastMessage}</div>
                    </div>
                    <button onClick={() => setShowClassToast(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 16, color: '#6b7280' }}>×</button>
                  </div>
                </div>
              </div>
              {/* Navigation */}
              <Nav variant="tabs" className={`px-3 pt-3 ${isMobile ? 'classroom-mobile-nav' : ''}`} style={{ borderBottom: '1px solid #dee2e6' }}>
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === "students"}
                    onClick={() => setActiveTab("students")}
                    className="d-flex align-items-center"
                    style={{ 
                      borderRadius: activeTab === "students" ? '12px 12px 0 0' : '12px',
                      fontSize: '16px',
                      transition: 'all 0.2s ease',
                      color: activeTab === "students" ? '#4285F4' : '#6c757d',
                      backgroundColor: activeTab === "students" ? '#fff' : 'transparent',
                      border: activeTab === "students" ? '1px solid #dee2e6' : '1px solid transparent',
                      borderBottom: activeTab === "students" ? '1px solid #fff' : '1px solid transparent',
                      marginBottom: '-1px'
                    }}
                  >
                    <FaBookReader className="me-2" size={18} /> Students
                  </Nav.Link>
                </Nav.Item>
                {userRole === "admin" && (
                  <Nav.Item>
                    <Nav.Link
                      active={activeTab === "teachers"}
                      onClick={() => setActiveTab("teachers")}
                      className="d-flex align-items-center"
                      style={{ 
                        borderRadius: activeTab === "teachers" ? '12px 12px 0 0' : '12px',
                        fontSize: '16px',
                        transition: 'all 0.2s ease',
                        color: activeTab === "teachers" ? '#4285F4' : '#6c757d',
                        backgroundColor: activeTab === "teachers" ? '#fff' : 'transparent',
                        border: activeTab === "teachers" ? '1px solid #dee2e6' : '1px solid transparent',
                        borderBottom: activeTab === "teachers" ? '1px solid #fff' : '1px solid transparent',
                        marginBottom: '-1px'
                      }}
                    >
                      <FaChalkboardTeacher className="me-2" size={18} /> Teachers
                    </Nav.Link>
                  </Nav.Item>
                )}
                <Nav.Item>
                  <Nav.Link
                    active={activeTab === "sections"}
                    onClick={() => setActiveTab("sections")}
                    className="d-flex align-items-center"
                    style={{ 
                      borderRadius: activeTab === "sections" ? '12px 12px 0 0' : '12px',
                      fontSize: '16px',
                      transition: 'all 0.2s ease',
                      color: activeTab === "sections" ? '#4285F4' : '#6c757d',
                      backgroundColor: activeTab === "sections" ? '#fff' : 'transparent',
                      border: activeTab === "sections" ? '1px solid #dee2e6' : '1px solid transparent',
                      borderBottom: activeTab === "sections" ? '1px solid #fff' : '1px solid transparent',
                      marginBottom: '-1px'
                    }}
                  >
                    <FiUsers className="me-2" size={18} /> Sections
                  </Nav.Link>
                </Nav.Item>
              </Nav>
              {/* Content Area */}              <div className="p-4 pb-2" style={{ flex: 1, overflow: "visible", display: "flex", flexDirection: "column" }}>
                {/* Content Header */}<div className="d-flex justify-content-between align-items-center mb-4">
                  <div>                    <h4 className="mb-1" style={{ color: kidStyles.colors.primary, fontWeight: 'bold' }}>
                      {activeTab === "students" ? (
                        <span className="d-flex align-items-center">
                          <FaGraduationCap className="me-2" size={24} />
                          Students List
                        </span>                      ) : (activeTab === "teachers" && userRole === "admin") ? (
                        <span className="d-flex align-items-center">
                          <FaChalkboardTeacher className="me-2" size={24} />
                          Teachers List
                        </span>
                      ) : (
                        <span className="d-flex align-items-center">
                          <FaStar className="me-2" size={24} />
                          Sections
                        </span>
                      )}
                    </h4>
                    <p className="text-muted mb-0" style={{ fontWeight: '500' }}>
                      {activeTab === "students"
                        ? "Manage students and their sections"
                        : activeTab === "teachers"
                        ? "Manage teachers and their assigned sections"
                        : "Manage class sections"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className={`d-flex gap-3 align-items-center ${isMobile ? 'flex-column align-items-stretch' : ''}`}>
                    <div className={`d-flex gap-4 ${isMobile ? 'flex-column gap-3 w-100' : ''}`}>                      {/* Section Filter - Only visible for admin/teacher */}
                      {activeTab === "students" && (userRole === "admin" || userRole === "teacher") && (
                        <div title={userRole === "teacher" ? "This is your assigned section - it cannot be changed" : "Select a section to filter students"}>
                          <Form.Select 
                            value={selectedSection} 
                            onChange={(e) => setSelectedSection(e.target.value)}
                            className={isMobile ? 'classroom-mobile-section-filter' : ''}
                            style={{ 
                              width: isMobile ? '100%' : '200px', 
                              borderRadius: '50px',
                              border: userRole === "teacher" ? '2px solid #28a745' : '2px solid #E0E0E0',
                              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                              padding: '8px 16px',
                              fontSize: '0.9rem',
                              backgroundColor: userRole === "teacher" ? '#f8f9fa' : 'white',
                              color: userRole === "teacher" ? '#28a745' : 'inherit',
                              fontWeight: userRole === "teacher" ? '600' : 'normal',
                              cursor: userRole === "teacher" ? 'not-allowed' : 'pointer'
                            }}
                            size="sm"
                            disabled={userRole === "teacher"} // Disable for teachers
                          >
                          {userRole === "admin" ? (
                            <>
                              <option value="all">All Sections</option>
                              <option value="unassigned">Unassigned</option>
                              {filteredSections.map(section => (
                                <option key={section.id} value={section.name}>
                                  {section.name}
                                </option>
                              ))}
                            </>
                          ) : (
                            // For teachers, only show their assigned section
                            <option value={teachers.find(t => t.uid === userId || t.id === userId)?.section_name || teachers.find(t => t.uid === userId || t.id === userId)?.assignedSectionName || ''}>
                              {teachers.find(t => t.uid === userId || t.id === userId)?.section_name || teachers.find(t => t.uid === userId || t.id === userId)?.assignedSectionName || 'No Section Assigned'} 
                              {teachers.find(t => t.uid === userId || t.id === userId)?.section_name || teachers.find(t => t.uid === userId || t.id === userId)?.assignedSectionName ? ' (Your Assigned Section)' : ''}
                            </option>
                          )}
                          </Form.Select>
                        </div>
                      )}{/* Search */}
                      <div className={`d-flex gap-2 ${isMobile ? 'classroom-mobile-search' : ''}`}>
                        <InputGroup style={{ 
                          width: isMobile ? "100%" : "240px",
                          borderRadius: '50px',
                          overflow: 'hidden',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                        }}>                          <Form.Control
                            placeholder="Search Name"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                              borderRadius: '50px 0 0 50px', 
                              border: '2px solid #e0e6ff',
                              borderRight: 'none'
                            }}
                          />
                          <InputGroup.Text style={{ 
                            borderRadius: '0 50px 50px 0',
                            border: '2px solid #e0e6ff',
                            borderLeft: 'none',
                            background: kidStyles.colors.primary,
                            color: 'white'
                          }}>
                            <FiSearch />
                          </InputGroup.Text>
                        </InputGroup>
                      </div>

                      {/* Student List Button */}
                      {activeTab === "students" && (
                        userRole === "admin" || userRole === "teacher"
                      ) && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className={`${isMobile ? 'classroom-mobile-btn w-100' : 'classroom-mobile-btn'}`}
                          onClick={() => setShowPrintModal(true)}
                        >
                          <FiDownload size={14} className="me-1" /> Get Student List
                        </Button>
                      )}
                    </div>

                    {/* Add Section Button */}
                    {activeTab === "sections" && userRole === "admin" && (
                      <Button
                        variant="outline-primary"
                        className={`${isMobile ? 'classroom-mobile-btn w-100' : 'classroom-mobile-btn'}`}
                        style={{
                          padding: '8px 20px',
                          fontSize: '0.9rem',
                          fontWeight: '500'
                        }}
                        onClick={() => handleShowModal("create")}
                      >
                        <FiPlus size={16} className="me-1" /> Add Section
                      </Button>
                    )}
                  </div>                </div>
                
                {/* Bulk Actions Bar - Only show for admin when students are selected */}
                {activeTab === "students" && userRole === "admin" && selectedStudents.size > 0 && (
                  <div className="mb-3 p-3 rounded-3" style={{ 
                    background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.05), rgba(52, 168, 83, 0.05))',
                    border: '1px solid rgba(66, 133, 244, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div className="d-flex align-items-center gap-2">
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: kidStyles.colors.primary,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}>
                        {selectedStudents.size}
                      </div>
                      <span style={{ fontWeight: '600', color: kidStyles.colors.primary }}>
                        {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                    
                    <div className="d-flex gap-2 flex-wrap">
                      {/* Move to Section Dropdown */}
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-primary" id="dropdown-basic" size="sm" style={{ borderRadius: '20px', fontSize: '0.85rem' }}>
                          <FiUsers size={14} className="me-1" />
                          Move to Section
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                          <Dropdown.Item as="button" onClick={() => handleBulkSectionChange('unassign')}>📋 Unassigned</Dropdown.Item>
                          <Dropdown.Divider />
                          {sections.map(section => (
                            <Dropdown.Item as="button" key={section.id} onClick={() => handleBulkSectionChange(section.id)}>🏫 {section.name}</Dropdown.Item>
                          ))}
                        </Dropdown.Menu>
                      </Dropdown>
                      
                      {/* Clear Selection */}
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedStudents(new Set());
                          setSelectAll(false);
                        }}
                        style={{ borderRadius: '20px', fontSize: '0.85rem' }}
                      >
                        <FiX size={14} className="me-1" />
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Tables */}                <div className={isMobile ? 'classroom-mobile-content' : ''} style={{ overflowY: "visible", overflowX: "auto" }}>
                  {activeTab === "students" && (
                    <div className={`student-table-container ${isMobile ? 'classroom-mobile-tab-content' : ''}`} style={{ 
                      maxHeight: isMobile ? "calc(100vh - 200px)" : "calc(100vh - 260px)", 
                      overflowY: "auto",
                      overflowX: isMobile ? "auto" : "visible",
                      borderRadius: "10px",
                      border: "1px solid rgba(0,0,0,0.05)",
                      marginBottom: "10px",
                      width: isMobile ? "100%" : "auto",
                      ...kidStyles.scrollbar
                    }}>
                      <Table hover className={isMobile ? 'classroom-mobile-table' : ''} style={{ marginBottom: 0 }}>
                        <thead style={{ backgroundColor: 'rgba(66, 133, 244, 0.1)' }}>
                          <tr>
                            {/* Bulk Select Checkbox - Only for admin */}
                            {userRole === "admin" && (
                              <th style={{ padding: '15px', borderTop: 'none', width: '50px' }}>
                                <Form.Check
                                  type="checkbox"
                                  checked={selectAll}
                                  onChange={(e) => handleSelectAll(e.target.checked)}
                                  style={{ 
                                    accentColor: kidStyles.colors.primary,
                                    transform: 'scale(1.2)'
                                  }}
                                />
                              </th>
                            )}
                            <th style={{ padding: '15px', borderTop: 'none', width: '170px' }}>
                              <div className="d-flex align-items-center">
                                <div className="me-2" style={{ 
                                  width: '24px', 
                                  height: '24px', 
                                  borderRadius: '50%', 
                                  background: kidStyles.colors.primary,
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>ID</div>
                                Student ID
                              </div>
                            </th>
                            <th style={{ padding: '15px 30px', borderTop: 'none', minWidth: '220px' }}>
                              <div className="d-flex align-items-center">
                                <FaBookReader className="me-2" style={{ color: kidStyles.colors.primary }} /> Name
                              </div>
                            </th>
                            <th style={{ padding: '15px', borderTop: 'none', minWidth: '160px' }}>
                              <div className="d-flex align-items-center">
                                <FaChalkboardTeacher className="me-2" style={{ color: kidStyles.colors.primary }} /> Section
                              </div>
                            </th>
                            {userRole === "admin" && <th style={{ padding: '15px', borderTop: 'none' }}>Actions</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {[...students]
                            .filter(student => {
                              // Search filter (robust against missing fields)
                              const matchesSearch = searchTerm === '' || 
                                (`${student.first_name || student.firstname || ''} ${student.last_name || student.lastname || ''}`.toLowerCase().includes((searchTerm || '').toLowerCase())) ||
                                ((student.student_id || '').toLowerCase().includes((searchTerm || '').toLowerCase())) ||
                                ((student.emailaddress || student.email || '').toLowerCase().includes((searchTerm || '').toLowerCase()));

                              // Section filter based on user role
                              let matchesSection = true;
                              if (userRole === "teacher") {
                                // Teacher can only see students in their section
                                const currentTeacher = teachers.find(t => t.uid === userId || t.id === userId);
                                const teacherSection = currentTeacher?.section_name || currentTeacher?.assignedSectionName;
                                
                                // Only show students if teacher is assigned to a section
                                matchesSection = teacherSection ? 
                                  (student.section_name === teacherSection || student.section?.name === teacherSection) : 
                                  false;
                              } else if (userRole === "admin") {
                                // Admin can see all students based on selected section filter
                                matchesSection = selectedSection === 'all' || 
                                  (selectedSection === 'unassigned' && !student.section_name && !student.section?.name) ||
                                  (student.section_name === selectedSection || student.section?.name === selectedSection);
                              }
                              
                              return matchesSearch && matchesSection;
                            })
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                            .map((student, index) => (
                              <tr 
                                key={student.id}
                                className="hoverable-row"
                                style={{ 
                                  backgroundColor: student.id === userId ? 'rgba(251, 188, 5, 0.1)' : 'transparent',
                                  fontWeight: student.id === userId ? '500' : 'normal'
                                }}>
                                {/* Bulk Select Checkbox - Only for admin */}
                                {userRole === "admin" && (
                                  <td style={{ padding: '15px', verticalAlign: 'middle' }}>
                                    <Form.Check
                                      type="checkbox"
                                      checked={selectedStudents.has(student.id)}
                                      onChange={(e) => {
                                        e.stopPropagation(); // Prevent row click
                                        handleSelectStudent(student.id, e.target.checked);
                                      }}
                                      onClick={(e) => e.stopPropagation()} // Prevent row click
                                      style={{ 
                                        accentColor: kidStyles.colors.primary,
                                        transform: 'scale(1.1)'
                                      }}
                                    />
                                  </td>
                                )}
                                <td 
                                  style={{ 
                                    padding: isMobile ? '10px 8px' : '15px',
                                    minWidth: isMobile ? '80px' : 'auto',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleRowClick(student)}
                                >
                                  <div className="d-flex align-items-center">
                                    <span style={{
                                      display: 'inline-block',
                                      padding: isMobile ? '3px 8px' : '4px 12px',
                                      borderRadius: '50px',
                                      background: 'rgba(66, 133, 244, 0.1)',
                                      color: kidStyles.colors.primary,
                                      fontWeight: '500',
                                      fontSize: isMobile ? '0.8rem' : '0.9rem',
                                      whiteSpace: 'nowrap'
                                    }}>
                                      {student.student_id || 'N/A'}
                                    </span>
                                  </div>
                                </td>
                                <td 
                                  style={{ 
                                    padding: isMobile ? '10px 18px' : '15px 30px',
                                    minWidth: isMobile ? '160px' : '220px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    cursor: 'pointer'
                                  }} 
                                  title={(student.first_name && student.last_name) ? `${student.first_name} ${student.last_name}` : 'No Name'}
                                  onClick={() => handleRowClick(student)}
                                >
                                  {(student.first_name && student.last_name)
                                    ? `${student.first_name} ${student.last_name}`
                                    : 'No Name'}
                                </td>
                                <td 
                                  style={{ 
                                    padding: isMobile ? '10px 8px' : '15px',
                                    minWidth: isMobile ? '120px' : 'auto',
                                    textAlign: 'left',
                                    cursor: 'pointer'
                                  }}
                                  onClick={() => handleRowClick(student)}
                                >
                                  {student.section?.name || student.section_name || 'Unassigned'}
                                </td>
                                {userRole === "admin" && (
                                  <td style={{ padding: isMobile ? '10px 8px' : '15px', textAlign: 'left', minWidth: '170px' }}>
                                    <Button
                                      variant="outline-primary"
                                      onClick={e => { e.stopPropagation(); handleShowModal('assign', student); }}
                                      style={{ borderRadius: '8px', fontSize: '0.95rem', padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                                      title="Assign Section">
                                      <FiEdit2 />
                                      <span style={{ display: isMobile ? 'none' : 'inline' }}>Assign Section</span>
                                    </Button>
                                  </td>
                                )}
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                  {activeTab === "teachers" && userRole === "admin" && (
                    <div className="teacher-table-container" style={{
                      maxHeight: "calc(100vh - 260px)",
                      overflowY: "auto",
                      overflowX: "visible",
                      borderRadius: "10px",
                      border: "1px solid rgba(0,0,0,0.05)",
                      marginBottom: "10px",
                      ...kidStyles.scrollbar
                    }}>
                      <Table hover className={isMobile ? 'classroom-mobile-table' : ''} style={{ marginBottom: 0 }}>
                        <thead style={{ backgroundColor: 'rgba(66, 133, 244, 0.1)' }}>
                          <tr>
                            <th style={{ padding: '15px', borderTop: 'none' }}>Name</th>
                            <th style={{ padding: '15px', borderTop: 'none' }}>Email</th>
                            <th style={{ padding: '15px', borderTop: 'none' }}>Section</th>
                            <th style={{ padding: '15px', borderTop: 'none' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {teachers
                            .filter(teacher =>
                              teacher.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              teacher.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (teacher.username || "").toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((teacher) => {
                              const assignedSection = sections.find(s => s.teacher_id === teacher.id);
                              return (
                                <tr key={teacher.id}>
                                  <td style={{ padding: '15px' }}>{`${teacher.first_name} ${teacher.last_name}`}</td>
                                  <td style={{ padding: '15px' }}>{teacher.username}</td>
                                  <td style={{ padding: '15px' }}>
                                    {teacher.assignedSectionName || 'Unassigned'}
                                  </td>
                                  <td style={{ padding: '15px' }}>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      style={{ borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, padding: '8px 18px' }}
                                      onClick={e => { e.stopPropagation(); handleShowModal('assign', { ...teacher, role: 'teacher', id: teacher.id }); }}
                                    >
                                      <FiEdit2 /> ASSIGN SECTION
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </Table>
                    </div>
                  )}
                  {activeTab === "sections" && (
                    <Table responsive hover className={isMobile ? 'classroom-mobile-table' : ''}>
                      <thead>
                        <tr>
                          <th>Section Name</th>
                          <th>Classroom</th>
                          <th>Time Period</th>
                          <th>Students</th>
                          <th>Max Students</th>
                          {userRole === "admin" && <th>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSections.map((section) => (
                          <tr key={section.id}>
                            <td>
                              <div className="fw-bold">{section.name || 'Unnamed Section'}</div>
                              <small className="text-muted">{section.school_year}</small>
                            </td>
                            <td>{section.classroom_number || 'Not set'}</td>
                            <td>
                              <span className="text-dark fw-medium">
                                {section.time_period?.charAt(0).toUpperCase() + section.time_period?.slice(1)}
                              </span>
                            </td>
                            <td>
                              <span className="text-dark fw-medium">
                                {section.student_count}
                              </span>
                            </td>
                            <td>{section.max_students || 25}</td>
                            {userRole === "admin" && (
                              <td>
                                <Button
                                  variant="outline-primary"
                                  className="me-2"
                                  style={{ 
                                    padding: '10px 16px',
                                    fontSize: '1rem'
                                  }}
                                  onClick={() => handleShowModal("edit", section)}>
                                  <FiEdit2 size={18} />
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  style={{ 
                                    padding: '10px 16px',
                                    fontSize: '1rem'
                                  }}
                                  onClick={() => handleShowModal("delete", section)}>
                                  <FiTrash2 size={18} />
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
  </Container>
      </div>

      {/* Modals */}      {/* Student Info Modal */}      <Modal
        show={showCredentialsModal}
        onHide={() => setShowCredentialsModal(false)}
        onExited={() => {
          // Reset any modal-specific state here if needed
        }}
        centered
        size={isMobile ? "md" : "lg"}
        className={isMobile ? 'student-info-mobile-modal' : ''}
        style={{
          maxHeight: isMobile ? '90vh' : 'auto'
        }}
        dialogClassName={isMobile ? 'modal-dialog-centered mx-3' : ''}
        animation={true}
      >
        <Modal.Header closeButton style={{ 
          border: 'none', 
          paddingBottom: 0,
          background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.1), rgba(52, 168, 83, 0.1))',
          borderRadius: '16px 16px 0 0',
          padding: isMobile ? '0.75rem' : '1rem 1.5rem',
          justifyContent: 'center',
          position: 'relative',
          minHeight: isMobile ? '50px' : 'auto'
        }}>          <Modal.Title style={{ 
            fontSize: isMobile ? '1rem' : '1.1rem', 
            fontWeight: 'bold',
            color: kidStyles.colors.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            textAlign: 'center'
          }}>
            <FaStar className="me-2" size={isMobile ? 14 : 16} /> Student Information
          </Modal.Title>
        </Modal.Header>        <Modal.Body className={`${isMobile ? 'p-2' : 'pt-3 pb-0 px-4'}`} style={{ 
          maxHeight: isMobile ? 'calc(90vh - 120px)' : 'auto',
          overflowY: 'auto',
          background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.05), rgba(52, 168, 83, 0.05))'
        }}>{selectedStudent && (
            <div>
              {/* Student Name and ID - Centered at top */}
              <div className="text-center mb-4">
                <div className="d-inline-flex align-items-center justify-content-center rounded-circle p-0 mb-2" style={{
                  width: isMobile ? '60px' : '70px',
                  height: isMobile ? '60px' : '70px',
                  padding: isMobile ? '0.75rem' : '1rem',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {studentAvatarUrl ? (
                    <img src={studentAvatarUrl} alt="student-avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 15px rgba(0,0,0,0.12)', border: '3px solid white' }} />
                  ) : (
                    <div style={{ background: 'rgba(66, 133, 244, 0.1)', border: '3px solid white', width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaGraduationCap size={isMobile ? 24 : 32} className="text-primary" style={{ color: kidStyles.colors.primary }} />
                    </div>
                  )}
                </div>
                <h5 className={`mb-1 fw-bold ${isMobile ? 'fs-6' : ''}`} style={{ color: kidStyles.colors.primary }}>
                  {(selectedStudent?.first_name && selectedStudent?.last_name)
                    ? `${selectedStudent.first_name} ${selectedStudent.last_name}`
                    : 'No Name'}
                </h5>                
                <p className="text-muted small mb-0">
                  <span style={{ 
                    display: 'inline-block',
                    padding: isMobile ? '3px 12px' : '4px 16px',
                    borderRadius: '50px',
                    background: 'rgba(66, 133, 244, 0.1)',
                    color: kidStyles.colors.primary,
                    fontWeight: '600',
                    fontSize: isMobile ? '0.8rem' : '0.9rem',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                  }}>
                    {selectedStudent?.student_id || 'N/A'}
                  </span>
                </p>
              </div>
              {/* Content row with both containers */}
              <div className={`row g-0 align-items-stretch ${isMobile ? 'flex-column' : ''}`} 
                style={{ 
                  minHeight: isMobile ? "auto" : "300px",
                  margin: isMobile ? '0' : null
                }}>
                {/* Left side - Student details */}
                <div className={`${isMobile ? 'col-12 mb-2' : 'col-md-5'} d-flex`}>
                  <div className="border rounded-4 w-100" style={{ 
                    background: 'white',
                    boxShadow: isMobile ? '0 2px 8px rgba(0,0,0,0.05)' : '0 4px 15px rgba(0,0,0,0.05)',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: isMobile ? '0.75rem' : '1.5rem',
                    margin: isMobile ? '0 0.5rem' : '0'
                  }}>
                    <div className="d-flex align-items-center mb-2">
                      <div style={{ 
                        width: isMobile ? '20px' : '24px', 
                        height: isMobile ? '20px' : '24px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #FF6B6B, #FF8E53)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginRight: '8px',
                        boxShadow: '0 2px 6px rgba(255, 107, 107, 0.3)'
                      }}>
                        <FiUsers size={isMobile ? 10 : 12} style={{ color: 'white' }} />
                      </div>
                      <div className="fw-bold" style={{ 
                        fontSize: isMobile ? '0.9rem' : '1rem',
                        background: 'linear-gradient(45deg, #FF6B6B, #FF8E53)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0px 1px 2px rgba(0,0,0,0.05)'
                      }}>
                        Student Details
                      </div>
                    </div>
                    
                    <div className="d-flex flex-column gap-1 flex-grow-1">
                      <div className="p-3 rounded-4" style={{ 
                        background: 'rgba(251, 188, 5, 0.05)', 
                        padding: isMobile ? '0.75rem' : '1rem' 
                      }}>
                        <div className="text-muted small mb-1" style={{ 
                          fontWeight: '500', 
                          fontSize: isMobile ? '0.75rem' : '0.875rem' 
                        }}>
                          <span className="me-1">🏫</span> Section
                        </div>
                        <div className={`fw-medium ${isMobile ? 'small' : ''}`} style={{ 
                          color: (selectedStudent.section?.name || selectedStudent.section_name) ? kidStyles.colors.secondary : kidStyles.colors.accent2,
                          fontSize: isMobile ? '0.8rem' : '1rem'
                        }}>
                          {selectedStudent.section?.name || selectedStudent.section_name || "Unassigned"}
                        </div>
                      </div>

                      <div className="rounded-3" style={{ 
                        background: 'rgba(66, 133, 244, 0.05)', 
                        padding: isMobile ? '0.5rem' : '0.75rem',
                        marginBottom: '0.25rem'
                      }}>
                        <div className="text-muted small mb-0" style={{ fontWeight: '500', fontSize: isMobile ? '0.7rem' : '0.8rem' }}>
                          <span className="me-1">🎂</span> Birthday
                        </div>
                        <div className={`fw-medium ${isMobile ? 'small' : ''}`} style={{ wordBreak: 'break-all', fontSize: isMobile ? '0.8rem' : '1rem' }}>
                          {selectedStudent.date_of_birth ? new Date(selectedStudent.date_of_birth).toLocaleDateString() : 'Not provided'}
                        </div>
                      </div>
                      
                      <div className="p-3 rounded-4" style={{ background: 'rgba(234, 67, 53, 0.05)', padding: isMobile ? '0.75rem' : '1rem' }}>
                        <div className="text-muted small mb-1" style={{ fontWeight: '500', fontSize: isMobile ? '0.75rem' : '0.875rem' }}>
                          <span className="me-1">🗓️</span> Enrolled Date
                        </div>
                        <div className={`fw-medium ${isMobile ? 'small' : ''}`} style={{ fontSize: isMobile ? '0.8rem' : '1rem' }}>
                          {selectedStudent.enrollment_date ? new Date(selectedStudent.enrollment_date).toLocaleDateString() : (selectedStudent.created_at ? new Date(selectedStudent.created_at).toLocaleDateString() : 'Unknown')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                  {/* Right side - Parent information */}
                <div className={`${isMobile ? 'col-12' : 'col-md-7'} d-flex`}>
                  <div className="border rounded-4 p-3 w-100" style={{ 
                    background: 'white', 
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)', 
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: isMobile ? '1rem' : '1.5rem'
                  }}>
                    <div className="d-flex align-items-center mb-3">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ 
                            width: isMobile ? '28px' : '32px', 
                            height: isMobile ? '28px' : '32px', 
                            borderRadius: '8px', 
                            background: 'linear-gradient(135deg, #e6f0ff, #dbeafe)',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            boxShadow: '0 2px 6px rgba(59,130,246,0.08)'
                          }}>
                            <FaStar size={isMobile ? 12 : 14} style={{ color: kidStyles.colors.primary }} />
                          </div>
                          <div>
                            <div className="fw-bold" style={{ fontSize: isMobile ? '1rem' : '1.05rem', color: kidStyles.colors.primary }}>Parent Information</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {parentInfo ? (
                      <div style={{ paddingTop: '6px' }}>
                        <div className="border rounded-3 p-3" style={{ background: '#fff', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.03)' }}>
              <div className="d-flex align-items-center" style={{ gap: '14px' }}>
                <div style={{ width: isMobile ? '66px' : '86px', height: isMobile ? '66px' : '86px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(66, 133, 244, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(59,130,246,0.06)' }}>
                              {parentAvatarUrl ? (
                                  <img src={parentAvatarUrl} alt="parent-avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : parentInfo.profile_picture_url && /^https?:\/\//i.test(parentInfo.profile_picture_url) ? (
                                  <img src={parentInfo.profile_picture_url} alt="parent-avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                <div style={{ width: '100%', textAlign: 'center', color: '#065F46', fontWeight: 800, fontSize: isMobile ? '1.15rem' : '1.4rem' }}>{(parentInfo.first_name || parentInfo.last_name) ? (String(parentInfo.first_name || '').charAt(0) + (parentInfo.last_name ? String(parentInfo.last_name).charAt(0) : '')) : 'P'}</div>
                              )}
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ fontWeight: 800, fontSize: isMobile ? '1.02rem' : '1.12rem', color: '#111827' }}>{(parentInfo.first_name || parentInfo.last_name) ? `${parentInfo.first_name || ''} ${parentInfo.last_name || ''}`.trim() : 'Parent'}</div>
                                </div>

                              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                  <div style={{ flex: '1 1 45%', background: 'rgba(66,133,244,0.05)', padding: isMobile ? '8px' : '12px', borderRadius: 8 }}>
                                    <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: '#6B7280' }}>Email</div>
                                    <div style={{ color: parentInfo.email ? '#374151' : '#9ca3af', fontSize: isMobile ? '0.85rem' : '0.95rem' }}>{parentInfo.email || 'Email not provided'}</div>
                                  </div>

                                  <div style={{ flex: '1 1 45%', background: 'rgba(16,185,129,0.05)', padding: isMobile ? '8px' : '12px', borderRadius: 8 }}>
                                    <div style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: '#6B7280' }}>Contact</div>
                                    <div style={{ color: parentInfo.contact ? '#374151' : '#9ca3af', fontSize: isMobile ? '0.85rem' : '0.95rem' }}>{parentInfo.contact || 'Contact not provided'}</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-muted py-3">No parent information available</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>        <Modal.Footer style={{ 
          border: 'none', 
          justifyContent: 'center',
          background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.1), rgba(52, 168, 83, 0.1))',
          borderRadius: '0 0 16px 16px',
          padding: isMobile ? '0.5rem' : '1rem'
        }}>
          <Button 
            size={isMobile ? "sm" : "sm"} 
            onClick={() => setShowCredentialsModal(false)}
            style={{
              borderRadius: '50px',
              fontWeight: '600',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              backgroundColor: kidStyles.colors.accent2,
              borderColor: kidStyles.colors.accent2,
              fontSize: isMobile ? '0.8rem' : '0.875rem',
              padding: isMobile ? '0.25rem 1rem' : '0.375rem 1.25rem'
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

        {/* Bulk Move Confirmation Modal */}
        <Modal show={showBulkMoveModal} onHide={() => setShowBulkMoveModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title style={{ color: kidStyles.colors.primary }}>Confirm Move</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: 'rgba(66,133,244,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiUsers size={28} style={{ color: kidStyles.colors.primary }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: isMobile ? '1rem' : '1.05rem' }}>{`Move ${selectedStudents.size} selected student(s)`}</div>
                <div style={{ color: '#6b7280', marginTop: 6 }}>to <strong>{bulkMoveTargetName}</strong>?</div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', flexWrap: 'nowrap', padding: isMobile ? '0.5rem' : '1rem' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'nowrap' }}>
            <Button 
              onMouseEnter={() => setCancelHover(true)}
              onMouseLeave={() => setCancelHover(false)}
              onClick={() => setShowBulkMoveModal(false)}
              variant="light"
              size="sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: cancelHover ? '#ef4444' : 'white',
                color: cancelHover ? 'white' : '#ef4444',
                borderRadius: 999,
                height: 42,
                boxSizing: 'border-box',
                padding: '0 18px',
                border: 'none',
                fontWeight: 800,
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                boxShadow: cancelHover ? '0 12px 26px rgba(239,68,68,0.18)' : '0 6px 14px rgba(0,0,0,0.06)',
                verticalAlign: 'middle',
                transform: cancelHover ? 'translateY(-2px)' : 'none',
                transition: 'all 170ms ease'
              }}
            >
              Cancel
            </Button>

            <Button
              onMouseEnter={() => setBulkMoveHover(true)}
              onMouseLeave={() => setBulkMoveHover(false)}
              onClick={performBulkSectionChange}
              disabled={bulkMoveInProgress}
              size="sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: bulkMoveHover ? kidStyles.colors.primary : 'white',
                color: bulkMoveHover ? 'white' : kidStyles.colors.primary,
                borderRadius: 999,
                height: 42,
                boxSizing: 'border-box',
                padding: '0 18px',
                border: `2px solid ${bulkMoveHover ? kidStyles.colors.primary : 'transparent'}`,
                fontWeight: 800,
                fontSize: isMobile ? '0.8rem' : '0.875rem',
                cursor: bulkMoveInProgress ? 'not-allowed' : 'pointer',
                boxShadow: bulkMoveHover ? '0 12px 26px rgba(59,130,246,0.18)' : '0 6px 14px rgba(0,0,0,0.06)',
                whiteSpace: 'nowrap',
                flex: '0 0 auto',
                verticalAlign: 'middle',
                transform: bulkMoveHover ? 'translateY(-12px)' : 'translateY(-8px)',
                transition: 'all 170ms ease'
              }}
            >
              {bulkMoveInProgress ? 'Moving...' : `MOVE TO ${String(bulkMoveTargetName).toUpperCase()}`}
            </Button>
            </div>
          </Modal.Footer>
        </Modal>

      {/* Student List Modal */}
      <Modal 
        show={showPrintModal} 
        onHide={() => setShowPrintModal(false)} 
        onExited={() => {
          // Reset print modal state if needed
          setPrintModalSection("all");
        }}
        size={isMobile ? "sm" : "lg"} 
        centered
        className={isMobile ? 'student-list-mobile-modal' : ''}
        animation={true}
      >
        <Modal.Header closeButton className={isMobile ? 'p-2' : ''}>
          <Modal.Title className={`d-flex align-items-center justify-content-center w-100 ${isMobile ? 'fs-6' : ''}`}>
            Student List
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className={isMobile ? 'p-2' : ''}>
          <div className={`d-flex justify-content-center mb-3 ${isMobile ? 'flex-column gap-2' : 'justify-content-between'}`}>
            <div className={`d-flex gap-2 align-items-center ${isMobile ? 'flex-column w-100' : ''}`}>
              {userRole === "admin" ? (
                <Form.Select 
                  value={printModalSection} 
                  onChange={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setPrintModalSection(e.target.value);
                  }}
                  style={{ width: isMobile ? '100%' : '200px' }}
                  className={isMobile ? 'mb-2' : ''}
                  size={isMobile ? 'sm' : undefined}
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <option value="all">All Sections</option>
                  <option value="unassigned">Unassigned</option>
                  {filteredSections.map(section => (
                    <option key={section.id} value={section.name}>{section.name}</option>
                  ))}
                </Form.Select>
              ) : (
                // For teachers, show the assigned section as plain text (non-selectable)
                <div style={{
                  width: isMobile ? '100%' : '200px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: 'white',
                  color: '#333',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isMobile ? 'center' : 'flex-start'
                }} className={isMobile ? 'mb-2' : ''}>
                  {teachers.find(t => t.uid === userId || t.id === userId)?.section_name || teachers.find(t => t.uid === userId || t.id === userId)?.assignedSectionName || 'No Section Assigned'}
                </div>
              )}
              
              <div className={`format-switch-container d-flex align-items-center gap-2 ${isMobile ? 'w-100 justify-content-center' : ''}`}>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    id="format-toggle"
                    checked={downloadType === "csv"}
                    onChange={() => setDownloadType(downloadType === "pdf" ? "csv" : "pdf")}
                    style={{ display: 'none' }}
                  />
                  <label 
                    htmlFor="format-toggle" 
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '4px' : '6px',
                      cursor: 'pointer',
                      padding: isMobile ? '3px 6px' : '4px 8px',
                      borderRadius: '50px',
                      background: 'rgba(66, 133, 244, 0.1)',
                      border: '2px solid #e0e6ff',
                      transition: 'all 0.3s ease',
                      width: isMobile ? '100%' : 'auto',
                                                                                                                                                     justifyContent: 'center'
                    }}
                  >
                    <span 
                      style={{
                        padding: isMobile ? '2px 8px' : '3px 10px',
                        borderRadius: '50px',
                        background: downloadType === "pdf" ? kidStyles.colors.primary : 'transparent',
                        color: downloadType === "pdf" ? 'white' : '#666',
                        transition: 'all 0.3s ease',
                        fontWeight: downloadType === "pdf" ? '600' : '400',
                        fontSize: isMobile ? '0.75rem' : '0.85rem'
                      }}
                    >
                      PDF
                    </span>
                    <span 
                      style={{
                        padding: isMobile ? '2px 8px' : '3px 10px',
                        borderRadius: '50px',
                        background: downloadType === "csv" ? kidStyles.colors.primary : 'transparent',
                        color: downloadType === "csv" ? 'white' : '#666',
                        transition: 'all 0.3s ease',
                        fontWeight: downloadType === "csv" ? '600' : '400',
                        fontSize: isMobile ? '0.75rem' : '0.85rem'
                      }}
                    >
                      CSV
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div 
            id="print-content" 
            ref={pdfContentRef} 
            style={{ 
              height: isMobile ? '300px' : '400px', 
              overflowY: 'auto',
              overflowX: isMobile ? 'auto' : 'hidden'
            }}
            className="d-flex flex-column align-items-center"
          >
            <Table 
              bordered 
              hover 
              className={`${isMobile ? 'classroom-mobile-table table-responsive' : ''} w-100`}
              style={{ 
                maxWidth: '100%',
                fontSize: isMobile ? '0.75rem' : '1rem',
                minWidth: isMobile ? '500px' : 'auto'
              }}
            >
              <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                <tr>
                  <th style={{ width: isMobile ? '80px' : '120px', padding: isMobile ? '8px 4px' : '12px' }}>
                    <div className="d-flex align-items-center justify-content-center">
                      <small>ID</small>
                    </div>
                  </th>
                  <th style={{ padding: isMobile ? '8px 4px' : '12px' }}>
                    <small>Student Name</small>
                  </th>
                  {/* Email and Contact columns removed per request */}
                  <th style={{ padding: isMobile ? '8px 4px' : '12px' }}>
                    <small>Section</small>
                  </th>
                </tr>
              </thead>
              <tbody>
                {printFilteredStudents.map(student => (
                  <tr key={student.id || student.student_id}>
                    <td style={{ padding: isMobile ? '6px 4px' : '12px' }}>
                      <div className="d-flex align-items-center justify-content-center">
                        <small>{student.student_id || 'N/A'}</small>
                      </div>
                    </td>
                    <td style={{ padding: isMobile ? '6px 4px' : '12px' }}>
                      <small>
                        {(student.first_name && student.last_name)
                          ? `${student.first_name} ${student.last_name}`
                          : 'No Name'}
                      </small>
                    </td>
                    {/* Email and Contact columns removed per request */}
                    <td style={{ padding: isMobile ? '6px 4px' : '12px' }}>
                      <small>{(student.section?.name || student.section_name || 'Unassigned')}</small>
                    </td>
                  </tr>
                ))}
                {students.filter(student => {
                  if (userRole === "teacher") {
                    const teacherSection = teachers.find(t => t.uid === userId)?.section_name;
                    return student.section_name === teacherSection;
                  } else {
                    return printModalSection === "all" ||
                      (printModalSection === "unassigned" && !student.section_name) ||
                      student.section_name === printModalSection;
                  }
                }).length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-3">
                      No students found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          <div className="text-muted mt-3 text-center">
            <small>
              Total: {printFilteredStudents.length} student
              {printFilteredStudents.length !== 1 ? 's' : ''}
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer className={`d-flex justify-content-center gap-2 ${isMobile ? 'p-2' : ''}`}>
          <Button 
            variant="outline-danger" 
            size="sm"
            onClick={() => setShowPrintModal(false)}
            className={isMobile ? 'flex-fill' : ''}
            style={{ fontSize: isMobile ? '0.8rem' : '0.875rem', padding: isMobile ? '0.25rem 0.5rem' : '0.375rem 0.75rem' }}
          >
            <FiX size={12} className="me-1" /> Close
          </Button>
            <Button 
            variant="outline-success" 
            size="sm"
            onClick={handleDownload}
            disabled={isGeneratingPdf || printFilteredStudents.length === 0}
            className={isMobile ? 'flex-fill' : ''}
            style={{ fontSize: isMobile ? '0.8rem' : '0.875rem', padding: isMobile ? '0.25rem 0.5rem' : '0.375rem 0.75rem' }}
          >
            <FiDownload size={12} className="me-1" />
            {isGeneratingPdf
              ? "Generating..."
              : downloadType === "pdf"
              ? "Download as PDF"
              : "Download as CSV"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Section Modal */}
      <SectionModal
        show={showModal}
        mode={modalMode}
        section={selectedItem}
        sections={sections}
        onHide={handleCloseModal}
        onExited={handleModalExited}
        onSubmit={handleSectionAction}
      />
    </div>
    </>
  );
};

// Section Modal Component
const SectionModal = ({ show, mode, section, sections, onHide, onExited, onSubmit }) => {
  const [formData, setFormData] = useState({
    section_name: "",
    new_section_name: "",
    old_section_name: "",
    new_section_id: "",
    time_period: "morning",
    classroom_number: "",
    max_students: 25,
    school_year: new Date().getFullYear().toString()
  });

  // Only update form data when modal is opening (show=true)
  useEffect(() => {
    if (show && section) {
      setFormData({
        section_name: section.name || section.section_name || "",
        new_section_name: section.name || section.section_name || "",
        old_section_name: section.name || section.section_name || "",
        new_section_id: "",
        time_period: section.time_period || "morning",
        classroom_number: section.classroom_number || "",
        max_students: section.max_students || 25,
        school_year: section.school_year || new Date().getFullYear().toString()
      });
    } else if (show && !section) {
      setFormData({
        section_name: "",
        new_section_name: "",
        old_section_name: "",
        new_section_id: "",
        time_period: "morning",
        classroom_number: "",
        max_students: 25,
        school_year: new Date().getFullYear().toString()
      });
    }
    // Don't reset when show becomes false - let onExited handle cleanup
  }, [section, show]);

  const handleModalClose = () => {
    // Just hide the modal, don't clear data (prevents form flash)
    onHide();
  };

  const handleModalExited = () => {
    // Reset form data only after modal animation completes
    setFormData({
      section_name: "",
      new_section_name: "",
      old_section_name: "",
      new_section_id: "",
      time_period: "morning",
      classroom_number: "",
      max_students: 25,
      school_year: new Date().getFullYear().toString()
    });
    // Call parent's onExited if provided
    if (onExited) onExited();
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    
    let actionData;
    switch (mode) {
      case "create":
        actionData = {
          section_name: formData.new_section_name,
          time_period: formData.time_period,
          classroom_number: formData.classroom_number,
          max_students: parseInt(formData.max_students),
          school_year: formData.school_year
        };
        break;
      case "edit":
        actionData = {
          old_section_name: formData.old_section_name,
          new_section_name: formData.new_section_name,
          time_period: formData.time_period,
          classroom_number: formData.classroom_number,
          max_students: parseInt(formData.max_students),
          school_year: formData.school_year
        };
        break;
      case "delete":
        actionData = { section_name: formData.old_section_name };
        break;
      case "assign":
        actionData = {
          section_id: formData.new_section_id,
          type: section?.type || (section?.role === 'teacher' ? 'teacher' : 'student'),
          teacher_id: section?.type === 'teacher' ? section.id : undefined,
          student_id: section?.type !== 'teacher' ? section.id : undefined
        };
        break;
    }
    
    // Submit the action
    onSubmit(mode, actionData);
    // Close modal - form data will be reset in onExited
    handleModalClose();
  };

  let title = "";
  switch (mode) {
    case "create":
      title = "Create New Section";
      break;
    case "edit":
      title = "Edit Section";
      break;
    case "delete":
      title = "Delete Section";
      break;
    case "assign":
      title = "Assign Section";
      break;
  }

  return (
    <Modal 
      show={show} 
      onHide={handleModalClose} 
      onExited={handleModalExited}
      centered 
      size={mode === 'create' || mode === 'edit' || mode === 'assign' ? 'md' : 'sm'}
      animation={true}
    >
      <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #e9ecef', padding: '12px 20px' }}>
        <Modal.Title style={{ color: '#495057', fontWeight: '600', fontSize: '1.1rem' }}>
          {mode === 'create' && <FiPlus className="me-2" />}
          {mode === 'edit' && <FiEdit2 className="me-2" />}
          {mode === 'delete' && <FiTrash2 className="me-2" />}
          {mode === 'assign' && <FiUsers className="me-2" />}
          {title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '16px 20px' }}>
        {mode === "delete" ? (
          <div className="text-center">
            <FiAlertCircle size={48} color="#ea5455" className="mb-3" />
            <p>Are you sure you want to delete this section?</p>
            <p className="text-muted">
              All students in this section will be unassigned.
            </p>
          </div>
        ) : mode === "assign" ? (
          <Form onSubmit={handleSubmit}>
            <Form.Group>
              <Form.Label>Select Section</Form.Label>
              <Form.Select
                value={formData.new_section_id || ""}
                onChange={(e) =>
                  setFormData({ ...formData, new_section_id: e.target.value })
                }
                style={{
                  minWidth: '100%',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                <option value="">Select a section...</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id} title={`${section.classroom_number} ${section.name} ${section.time_period.charAt(0).toUpperCase() + section.time_period.slice(1)}`}>
                    {`${section.classroom_number} ${section.name} ${section.time_period.charAt(0).toUpperCase() + section.time_period.slice(1)}`}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        ) : (
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>Section Name *</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter section name"
                value={formData.new_section_name}
                onChange={(e) =>
                  setFormData({ ...formData, new_section_name: e.target.value })
                }
                style={{ fontSize: '0.9rem', padding: '10px 12px' }}
                required
              />
            </Form.Group>

            <Row className="g-3 mb-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>Time Period *</Form.Label>
                  <Form.Select
                    value={formData.time_period}
                    onChange={(e) =>
                      setFormData({ ...formData, time_period: e.target.value })
                    }
                    style={{ fontSize: '0.9rem', padding: '10px 12px' }}
                    required
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>Classroom *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., Room 101"
                    value={formData.classroom_number}
                    onChange={(e) =>
                      setFormData({ ...formData, classroom_number: e.target.value })
                    }
                    style={{ fontSize: '0.9rem', padding: '10px 12px' }}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="g-3">
              <Col xs={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>Max Students</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="50"
                    value={formData.max_students}
                    onChange={(e) =>
                      setFormData({ ...formData, max_students: e.target.value })
                    }
                    style={{ fontSize: '0.9rem', padding: '10px 12px' }}
                  />
                </Form.Group>
              </Col>
              <Col xs={6}>
                <Form.Group>
                  <Form.Label style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '8px' }}>School Year</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., 2024-2025"
                    value={formData.school_year}
                    onChange={(e) =>
                      setFormData({ ...formData, school_year: e.target.value })
                    }
                    style={{ fontSize: '0.9rem', padding: '10px 12px' }}
                  />
                </Form.Group>
              </Col>
            </Row>

          </Form>
        )}
      </Modal.Body>      <Modal.Footer style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px 20px' }}>
        <Button 
          variant="outline-danger" 
          size="sm"
          style={{ padding: '6px 16px', fontSize: '0.85rem' }}
          onClick={handleModalClose}
        >
          <FiX size={14} className="me-1" /> Cancel
        </Button>
        <Button
          variant={mode === "delete" ? "outline-danger" : "outline-primary"}
          size="sm"
          style={{ padding: '6px 16px', fontSize: '0.85rem' }}
          onClick={handleSubmit}
        >
          {mode === "delete" ? (
            <><FiTrash2 size={14} className="me-1" /> Delete</>
          ) : mode === "assign" ? (
            <><FiUsers size={14} className="me-1" /> Assign</>
          ) : mode === "edit" ? (
            <><FiEdit2 size={14} className="me-1" /> Update</>
          ) : (
            <><FiPlus size={14} className="me-1" /> Create</>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ClassroomPage;

// Add styles to fix navigation tabs
const styles = document.createElement('style');
styles.innerHTML = `
  /* Format switch styling */
  .format-switch-container {
    margin: 0 10px;
  }

  .format-switch {
    position: relative;
    display: inline-block;
    width: 140px;
    height: 34px;
  }

  .format-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .format-switch .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    transition: 0.4s;
    border-radius: 34px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
  }
  .format-switch .slider:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 65px;
    left: 4px;
    bottom: 3px;
    background-color: #dc3545;
    transition: 0.4s;
    border-radius: 34px;
    z-index: 1;
  }

  .format-switch input:checked + .slider:before {
    transform: translateX(66px);
    background-color: #198754;
  }

  .format-switch .pdf,
  .format-switch .csv {
    color: #6c757d;
    font-size: 0.875rem;
    font-weight: 500;
    z-index: 2;
    transition: 0.4s;
    width: 65px;
    text-align: center;
  }

  .format-switch input:not(:checked) ~ .slider .pdf,
  .format-switch input:checked ~ .slider .csv {
    color: #fff;
  }

  /* Tab styling */
  .nav-tabs .nav-link {
    color: #212529 !important;
    font-weight: 500;
    border-color: transparent;
    background-color: transparent;
    opacity: 1;
    padding: 0.75rem 1rem;
    transition: all 0.2s ease;
    position: relative;
  }
  
  .nav-tabs .nav-link:hover {
    color: #4285F4 !important;
    background-color: rgba(66, 133, 244, 0.08);
    border-color: transparent;
    transform: translateY(-2px);
  }
  
  .nav-tabs .nav-link.active {
    color: #4285F4 !important;
    font-weight: 600;
    border-bottom: 2px solid #4285F4;
    background-color: rgba(66, 133, 244, 0.08);
  }
  /* Kid-friendly animations */
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }

  /* Apply animations to elements */
  .table button:hover {
    animation: pulse 0.5s ease-in-out;
  }
  
  /* Prevent scroll on row hover */
  .table {
    overflow: visible !important;
  }
  
  /* Hoverable row styling */
  .hoverable-row:hover {
    background-color: rgba(66, 133, 244, 0.05) !important;
  }
  
  /* Rounded borders for tables */
  .table {
    border-collapse: separate;
    border-spacing: 0;
    margin-bottom: 0;
  }
  
  /* Prevent table scrollbars */
  .table-responsive {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch;
    margin-bottom: 1rem;
  }

  @media (max-width: 768px) {
    .table-responsive {
      margin: 0 -15px;
      padding: 0 15px;
    }
    
    .table th,
    .table td {
      font-size: 0.85rem;
      padding: 0.5rem !important;
      white-space: nowrap;
    }

    .table-actions {
      display: flex;
      gap: 0.5rem;
    }

    .table-actions button {
      padding: 0.25rem 0.5rem !important;
      font-size: 0.85rem !important;
    }
  }

  /* Animated icons */
  .nav-link svg, 
  .modal-title svg,
  button svg {
    transition: transform 0.3s ease;
  }
  
  .nav-link:hover svg,
  button:hover svg {
    transform: scale(1.2);
  }

  /* Main Mobile Responsive Styles */
  @media (max-width: 768px) {
    /* Main container adjustments */
    .container-fluid {
      padding: 10px !important;
    }

    /* Card adjustments */
    .card {
      margin-bottom: 12px !important;
      border-radius: 15px !important;
    }

    /* Navigation tabs */
    .nav-tabs {
      overflow-x: auto;
      flex-wrap: nowrap;
      scrollbar-width: none;
      -ms-overflow-style: none;
      padding-bottom: 5px;
      margin-bottom: 15px !important;
    }

    .nav-tabs::-webkit-scrollbar {
      display: none;
    }

    .nav-tabs .nav-link {
      white-space: nowrap;
      font-size: 0.9rem;
      padding: 0.5rem 0.75rem;
    }

    /* Search and filters */
    .search-section {
      flex-direction: column !important;
      gap: 10px !important;
      margin-bottom: 15px !important;
    }

    .search-input {
      width: 100% !important;
    }

    .section-filter {
      width: 100% !important;
    }

    /* Tables */
    .table-responsive {
      margin: 0 -12px;
      padding: 0 12px;
      overflow-x: auto !important;
    }

    .table th,
    .table td {
      font-size: 0.85rem;
      padding: 8px !important;
      white-space: nowrap;
    }

    /* Action buttons */
    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .action-buttons button {
      padding: 4px 8px !important;
      font-size: 0.8rem !important;
    }

    /* Stats cards */
    .stats-card {
      padding: 12px !important;
    }

    .stats-card h3 {
      font-size: 1.2rem !important;
    }

    .stats-card p {
      font-size: 0.8rem !important;
    }

    /* Form groups in modals */
    .form-group {
      margin-bottom: 12px !important;
    }

    .form-label {
      font-size: 0.9rem !important;
    }

    .form-control {
      font-size: 0.9rem !important;
      padding: 8px 12px !important;
    }

    /* Buttons */
    .btn {
      padding: 8px 16px !important;
      font-size: 0.9rem !important;
    }

    /* Alert messages */
    .alert {
      margin: 10px 0 !important;
      padding: 8px 12px !important;
      font-size: 0.85rem !important;
    }

    /* Section cards */
    .section-card {
      padding: 12px !important;
      margin-bottom: 10px !important;
    }

    .section-card-title {
      font-size: 1rem !important;
    }

    .section-card-count {
      font-size: 0.8rem !important;
    }
  }

  /* Student List Modal Mobile Styles */
  @media (max-width: 768px) {
    .student-list-mobile-modal .modal-dialog {
      margin: 10px;
      max-width: calc(100vw - 20px);
    }
    
    .student-list-mobile-modal .modal-content {
      border-radius: 15px;
      max-height: calc(100vh - 40px);
      overflow: hidden;
    }
    
    .student-list-mobile-modal .modal-header {
      border-radius: 15px 15px 0 0;
      padding: 12px 16px;
      position: sticky;
      top: 0;
      background: white;
      z-index: 1000;
    }
    
    .student-list-mobile-modal .modal-body {
      padding: 12px 16px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
    
    .student-list-mobile-modal .modal-footer {
      padding: 12px 16px;
      border-radius: 0 0 15px 15px;
      position: sticky;
      bottom: 0;
      background: white;
      z-index: 1000;
    }
    
    .student-list-mobile-modal .table {
      font-size: 0.75rem;
      width: 100%;
    }

    .student-list-mobile-modal .search-filter-container {
      position: sticky;
      top: 0;
      background: white;
      z-index: 999;
      padding: 10px 0;
      margin: -12px -16px 12px;
      padding: 12px 16px;
      border-bottom: 1px solid #e9ecef;
    }
    
    .student-list-mobile-modal .table th,
    .student-list-mobile-modal .table td {
      padding: 6px 4px;
      vertical-align: middle;
    }
    
    .student-list-mobile-modal .format-switch-container {
      width: 100%;
    }
    
    .student-list-mobile-modal .format-switch-container label {
      width: 100%;
      justify-content: center;
    }

    /* Student Info Modal Mobile Styles */
    .student-info-mobile-modal .modal-dialog {
      margin: 1.75rem auto;
      max-width: 90%;
      display: flex;
      align-items: center;
      min-height: calc(100% - 3.5rem);
    }
    
    .student-info-mobile-modal .modal-content {
      border-radius: 20px;
      overflow: hidden;
      width: 100%;
      margin: auto;
    }
    
    .student-info-mobile-modal .modal-header {
      padding: 0.75rem 1rem;
    }
    
    .student-info-mobile-modal .modal-body {
      padding: 0.75rem;
      max-height: calc(100vh - 150px);
      overflow-y: auto;
    }
    
    .student-info-mobile-modal .modal-footer {
      padding: 0.75rem;
    }
    
    .student-info-mobile-modal .row {
      margin: 0;
    }
    
    .student-info-mobile-modal .col-12 {
      padding: 0;
    }
    
    .student-info-mobile-modal .rounded-4 {
      border-radius: 12px !important;
    }
    
    .student-info-mobile-modal h5 {
      font-size: 1rem !important;
      line-height: 1.3;
    }
  }
`

// Apply styles
const styleSheet = document.createElement("style");
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);
