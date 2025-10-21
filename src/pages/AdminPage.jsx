import parentsImage from '../admin_image/Parents.png';
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  InputGroup,
  Form,
  Alert,
  Modal,
  Nav,
  Pagination,
  Spinner
} from "react-bootstrap";
import {
  FiUsers,
  FiSearch,
  FiTrash2,
  FiEdit2,
  FiPlus,
  FiAlertCircle,
  FiUser,
  FiX,
  FiAlertTriangle,
  FiEye,
  FiEyeOff,
  FiUserPlus
} from "react-icons/fi";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { supabase, supabaseAdmin } from "../config/supabase";
import SideMenu from "../components/SideMenu";
import { colors } from "../styles/constants";
import { useNavigate } from "react-router-dom";

// Import admin images
import studentImage from '../admin_image/Student.jpg';
import teacherImage from '../admin_image/Teacher.jpg';
import adminImage from '../admin_image/Admin.jpg';

const AdminPage = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  const [showError, setShowError] = useState(false);
  const [parentCount, setParentCount] = useState(0);
  // Authentication check
  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    if (!userRole || userRole.toLowerCase() !== 'admin') {
      navigate('/login');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    // Fetch parent count from user_profiles
    const fetchParentCount = async () => {
      const { count, error } = await supabaseAdmin
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'parent');
      if (!error && typeof count === 'number') {
        setParentCount(count);
      }
    };
    fetchParentCount();
  }, []);
  // State management
  const [activeTab, setActiveTab] = useState('students');
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalAction, setModalAction] = useState({ type: '', data: null });
  const [showAlert, setShowAlert] = useState(false);
  const [alertData, setAlertData] = useState({ type: 'success', message: '' });
  // Admin toast (center-top) to unify feedback with app
  const [showAdminToast, setShowAdminToast] = useState(false);
  const [adminToastType, setAdminToastType] = useState('success'); // 'success'|'danger'|'info'
  const [adminToastMessage, setAdminToastMessage] = useState('');
  const [adminToastEntity, setAdminToastEntity] = useState('User');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adminError, setAdminError] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectAllOnPage, setSelectAllOnPage] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const todayStr = new Date().toISOString().split('T')[0];

  // Auto-hide admin toast after 3 seconds when shown
  useEffect(() => {
    if (!showAdminToast) return undefined;
    const id = setTimeout(() => setShowAdminToast(false), 3000);
    return () => clearTimeout(id);
  }, [showAdminToast]);
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(6); // Number of users per page
  // Refresh key for forcing UI update
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showEditChildModal, setShowEditChildModal] = useState(false);
  // Controlled state for Add Child form (redesign)
  const [childForm, setChildForm] = useState({
    firstname: '',
    middlename: '',
    lastname: '',
    date_of_birth: '',
    enrollment_date: ''
  });
  const [editChildForm, setEditChildForm] = useState({
    firstname: '',
    middlename: '',
    lastname: '',
    date_of_birth: '',
    enrollment_date: ''
  });
  const [childErrors, setChildErrors] = useState({});
  const [editChildErrors, setEditChildErrors] = useState({});
  const [selectedChild, setSelectedChild] = useState(null);

  // Helpers to check local form validity (used to disable submit buttons)
  const isChildFormValid = (form) => {
    if (!form) return false;
    if (!form.firstname?.trim()) return false;
    if (!form.lastname?.trim()) return false;
    if (!form.date_of_birth) return false;
    if (!form.enrollment_date) return false;
    // basic date checks
    const dob = new Date(form.date_of_birth);
    const enroll = new Date(form.enrollment_date);
    const today = new Date(todayStr);
    if (isNaN(dob.getTime()) || isNaN(enroll.getTime())) return false;
    if (dob > today) return false;
    if (enroll < dob) return false;
    if (enroll > today) return false;
    return true;
  };
  // preview removed per redesign
  // Reset current page when switching tabs to ensure consistency
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Clear selected parent when switching tabs so the children list auto-hides
  useEffect(() => {
    setSelectedUser(null);
    // clear any bulk selections when changing tabs
    setSelectedIds(new Set());
    setSelectAllOnPage(false);
  }, [activeTab]);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    if (!supabaseAdmin) {
      setAdminError('Admin client not available. Please check your environment configuration.');
      setIsLoading(false);
      return;
    }
    fetchUsers();
    // Removed fetchSections for section filter
  }, [refreshKey]);

  const fetchUsers = async () => {
    try {
      // Fetch all accounts from user_profiles
      const { data: allUsers, error: userError } = await supabaseAdmin
        .from('user_profiles')
          .select('id, role, username, first_name, middle_name, last_name, email, contact, created_at')
        .order('created_at', { ascending: false });
      if (userError) throw userError;
      setParents([...allUsers.filter(u => u.role === 'parent')]);
      setTeachers([...allUsers.filter(u => u.role === 'teacher')]);
      setAdmins([...allUsers.filter(u => u.role === 'admin')]);
      // Update parentCount so the stats card reflects changes (deletes/creates)
      try {
        const computedParentCount = (allUsers || []).filter(u => u.role === 'parent').length;
        setParentCount(computedParentCount);
      } catch (e) {
        // ignore errors computing count
      }

      // Fetch all students with parent information
      const { data: allStudents, error: studentError } = await supabaseAdmin
        .from('students')
        .select(`
          *,
          parent:user_profiles!parent_id(
            id,
            first_name,
            middle_name,
            last_name,
            username,
            email,
            contact
          )
        `);
      if (studentError) throw studentError;
      
      // Flatten parent data into student records for easier access
      const studentsWithParentInfo = allStudents?.map(student => ({
        ...student,
  parent_first_name: student.parent?.first_name || '',
  parent_middle_name: student.parent?.middle_name || '',
  parent_last_name: student.parent?.last_name || '',
        parent_email: student.parent?.email || student.parent?.username || '',
        parent_contact: student.parent?.contact || student.parent?.contact_number || ''
      })) || [];
      
      setStudents(studentsWithParentInfo);
    } catch (error) {
      showAlertMessage('danger', 'Failed to fetch users: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter functions
  const filteredStudents = students.filter(student => {
    const matchesSearch = `${student.first_name || student.firstname || ''} ${student.last_name || student.lastname || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.emailaddress || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredParents = parents.filter(parent => {
    const name = `${parent.first_name || parent.firstname || ''} ${parent.last_name || parent.lastname || ''}`.toLowerCase();
    const email = (parent.emailaddress || parent.username || parent.email || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  const filteredTeachers = teachers.filter(teacher =>
    (() => {
      const name = `${teacher.first_name || teacher.firstname || ''} ${teacher.last_name || teacher.lastname || ''}`.toLowerCase();
      const email = (teacher.emailaddress || teacher.username || teacher.email || '').toLowerCase();
      return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    })()
  );

  const filteredAdmins = admins.filter(admin =>
    (() => {
      const name = `${admin.first_name || admin.firstname || ''} ${admin.last_name || admin.lastname || ''}`.toLowerCase();
      const email = (admin.emailaddress || admin.username || admin.email || '').toLowerCase();
      return name.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
    })()
  );

  // Pagination logic
  const paginateUsers = (users) => {
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    return users.slice(indexOfFirstUser, indexOfLastUser);
  };

  const handleShowModal = async (type, user = null) => {
    if (type === 'delete') {
      setShowDeleteModal(true);
      setModalAction({ type, data: user });
    } else {
      setShowModal(true);
      // For create, initialize empty fields
      if (type === 'create') {
        setModalAction({
          type,
          data: {
            firstname: '',
            middlename: '',
            lastname: '',
            emailaddress: '',
            contactnumber: '',
            password: '',
            parentfirstname: '',
            parentmiddlename: '',
            parentlastname: '',
            section_name: null
          }
        });
      } else {
        // For edit, preserve all user info, including nulls/undefined
        const initialFormData = {};
        if (user) {
          Object.keys(user).forEach(key => {
            initialFormData[key] = user[key] !== undefined && user[key] !== null ? user[key] : '';
          });
        }
        initialFormData.password = '';

        // Map user_profiles fields to form field names for teachers/admins
        if (user && (user.role === 'teacher' || user.role === 'admin')) {
          initialFormData.firstname = user.first_name || '';
          initialFormData.lastname = user.last_name || '';
          initialFormData.emailaddress = user.username ? `${user.username}@example.com` : '';
        }


        setModalAction({ type, data: initialFormData });
      }
    }
  };

  // Start hiding modals. Do not immediately clear modalAction for the create/edit
  // modal because react-bootstrap's Modal will keep the dialog visible during
  // the exit animation — clearing the data too early causes the children to
  // re-render with empty data and produce a flash. We'll clear modalAction in
  // onExited after the animation finishes.
  const handleCloseModal = () => {
    setShowModal(false);
    setShowDeleteModal(false);
    // intentionally do NOT clear modalAction here
  };

  // Called after the create/edit modal has finished its exit animation.
  const handleModalExited = () => {
    setModalAction({ type: '', data: null });
  };

  // Close the delete confirmation modal and clear modalAction immediately.
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setModalAction({ type: '', data: null });
  };

  const showAlertMessage = (type, message) => {
    // Route legacy showAlertMessage calls to the admin toast
    const toastType = (type === 'danger' || type === 'warning') ? 'danger' : 'success';
    setAdminToastType(toastType);
    setAdminToastMessage(message);
    setAdminToastEntity('Notification');
    setShowAdminToast(true);
    // Auto-hide after 3 seconds
    setTimeout(() => setShowAdminToast(false), 3000);
  };
  // Validate form data
  const validateFormData = (formData) => {
    const errors = {};
    if (!formData.firstname?.trim()) errors.firstname = 'First name is required';
    if (!formData.lastname?.trim()) errors.lastname = 'Last name is required';
    if (!formData.emailaddress?.trim()) errors.emailaddress = 'Email is required';
    
    // Contact number is optional since it's not stored in user_profiles table
    if (formData.contactnumber && formData.contactnumber.trim()) {
      const phoneRegex = /^0\d{10}$/;
      if (!phoneRegex.test(formData.contactnumber)) {
        errors.contactnumber = 'Enter a valid 11-digit phone number starting with 0';
      }
    }

    if (modalAction.type === 'create' && !formData.password?.trim()) {
      errors.password = 'Password is required';
    }

    // Validate parent information for students
    if (activeTab === 'students') {
      if (!formData.parentfirstname?.trim()) errors.parentfirstname = 'Parent first name is required';
      if (!formData.parentlastname?.trim()) errors.parentlastname = 'Parent last name is required';
    }

    return errors;
  };

  // Form submission handlers
const handleFormSubmit = async (formData) => {
  try {
    
    // Basic sanity check
    if (!formData) {
      throw new Error('No form data provided');
    }
    
    if (!modalAction || !modalAction.type) {
      throw new Error('Invalid modal action');
    }
    
    // Validate form fields
    const errors = {};
    if (!formData.firstname?.trim()) errors.firstname = 'First name is required';
    if (!formData.lastname?.trim()) errors.lastname = 'Last name is required';
    
    // Require email/contact only when creating a new user (not on edit)
    if (modalAction.type === 'create') {
      if (!formData.emailaddress?.trim()) {
        errors.emailaddress = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.emailaddress)) {
        errors.emailaddress = 'Invalid email address';
      }
      
      // Contact number is optional since it's not stored in user_profiles table
      if (formData.contactnumber && formData.contactnumber.trim()) {
        const phoneRegex = /^0\d{10}$/;
        if (!phoneRegex.test(formData.contactnumber)) {
          errors.contactnumber = 'Enter a valid 11-digit phone number starting with 0';
        }
      }
      
      if (!formData.password?.trim()) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
    }
    
    // Special handling for adding a child to existing parent
    if (formData.isAddingChild && selectedUser && selectedUser.role === 'parent') {
      // Generate next student ID
      const { data: maxStudent, error: maxStudentError } = await supabaseAdmin
        .from('students')
        .select('student_id')
        .order('student_id', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (maxStudentError) throw maxStudentError;
      
      let nextNumber = 1;
      if (maxStudent && maxStudent.student_id) {
        const match = maxStudent.student_id.match(/STU(\d{3})/);
        if (match) nextNumber = parseInt(match[1], 10) + 1;
      }
      const studentId = `STU${String(nextNumber).padStart(3, '0')}`;
      
      // Create student record
      const today = new Date();
      const birthDate = formData.date_of_birth ? new Date(formData.date_of_birth) : null;
      const enrollmentDate = formData.enrollment_date ? new Date(formData.enrollment_date) : today;
      
      const studentProfile = {
        id: crypto.randomUUID(),
        parent_id: selectedUser.id,
        first_name: formData.firstname.trim(),
        middle_name: formData.middlename?.trim() || null,
        last_name: formData.lastname.trim(),
        date_of_birth: birthDate ? birthDate.toISOString().split('T')[0] : null,
        student_id: studentId,
        enrollment_date: enrollmentDate.toISOString().split('T')[0],
        created_at: today.toISOString(),
      };
      
      const { error: studentError } = await supabaseAdmin
        .from('students')
        .insert([studentProfile]);
      
      if (studentError) throw new Error('Failed to create student record: ' + studentError.message);
      
      showAlertMessage('success', 'Child added successfully to parent\'s account!');
      setRefreshKey(prev => prev + 1);
      setShowAddChildModal(false);
      setIsAddingChild(false);
      return;
    }
    
    // For edits, validate only if fields are provided
    if (modalAction.type === 'edit') {
      
      if (formData.emailaddress && formData.emailaddress.trim() && !/\S+@\S+\.\S+/.test(formData.emailaddress)) {
        errors.emailaddress = 'Invalid email address';
      }
      if (formData.password && formData.password.trim() && formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      }
      if (formData.contactnumber && formData.contactnumber.trim()) {
        const phoneRegex = /^0\d{10}$/;
        if (!phoneRegex.test(formData.contactnumber)) {
          errors.contactnumber = 'Enter a valid 11-digit phone number starting with 0';
        }
      }
      
    }
    // Parent names required only when creating a student or adding a child to an existing parent
    if (activeTab === 'students' && (modalAction.type === 'create' || formData.isAddingChild)) {
      if (!formData.parentfirstname?.trim()) errors.parentfirstname = 'Parent first name is required';
      if (!formData.parentlastname?.trim()) errors.parentlastname = 'Parent last name is required';
    }
    if (Object.keys(errors).length > 0) {
      showAlertMessage('danger', Object.values(errors).join(', '));
      return;
    }

    // Check if email already exists in Supabase Auth (for all new user creation)
    if (modalAction.type === 'create') {
      const { data: existingUser, error: lookupError } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('username', formData.emailaddress.split('@')[0])
        .maybeSingle();
      if (lookupError) {
        showAlertMessage('danger', 'Error checking for existing user: ' + lookupError.message);
        return;
      }
      if (existingUser && existingUser.id) {
        showAlertMessage('danger', 'This email is already registered. Please use another email.');
        return;
      }
    }

    // Create user in Supabase Auth (for all new user creation)
    let authData = null;
    if (modalAction.type === 'create') {
      // Validate supabaseAdmin is available
      if (!supabaseAdmin) {
        showAlertMessage('danger', 'Admin operations not available. Please check environment configuration.');
        return;
      }

      
      // Create auth user with the admin client for immediate activation
      const { data: authResponse, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.emailaddress,
        password: formData.password,
        // Do not auto-confirm the email so the parent receives a verification/reset email
        email_confirm: false,
        user_metadata: { role: activeTab.slice(0, -1) }
      });


      if (authError) {
        // Provide more helpful error messages for common cases
        const msg = authError.message || String(authError);
        if (msg.includes('already registered') || msg.includes('duplicate')) {
          showAlertMessage('danger', 'This email is already registered. Please use another email.');
          return;
        }
        showAlertMessage('danger', 'Registration failed: ' + msg);
        return;
      }

      // The admin.createUser response shape can vary between SDK versions:
      // - it may return { user: { id, ... } }
      // - or return the user object directly
      // Normalize the result so downstream code can use authData.user.id
      let createdUser = null;
      if (!authResponse) {
        showAlertMessage('danger', 'Registration failed: No user data returned');
        return;
      }
      if (authResponse.user) createdUser = authResponse.user;
      else createdUser = authResponse;

      if (!createdUser || !createdUser.id) {
        showAlertMessage('danger', 'Registration failed: No valid user id returned');
        return;
      }

      // Set authData to match the older signUp shape (authData.user.id)
      authData = { user: createdUser };
    }

    // If editing an existing user and a new password is provided, update the user's password in Supabase Auth
    if (modalAction.type !== 'create' && formData.password && formData.password.trim()) {
      try {
        // Verify this id maps to an auth-backed profile (not a student record)
        const { data: profileRecord, error: profileErr } = await supabaseAdmin
          .from('user_profiles')
          .select('id, role, username')
          .eq('id', formData.id)
          .maybeSingle();

        if (profileErr) throw profileErr;

        if (!profileRecord) {
          // If no user_profiles record found, skip auth update
        } else if (profileRecord.role === 'student') {
          // Students don't have Supabase Auth accounts in this schema
        } else {
          // For password updates on teachers/admins, we need to use the admin service role
          
          // Use admin client to update user password
          const { data: updatedAuth, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
            formData.id, 
            { 
              password: formData.password,
              email_confirm: true // Skip email confirmation for admin updates
            }
          );
          
          if (updateAuthError) {
            // Don't throw here, just show warning - profile update can still succeed
            showAlertMessage('warning', `Profile updated but password change failed: ${updateAuthError.message}`);
          } else {
            showAlertMessage('success', 'Password updated successfully');
          }
        }
      } catch (err) {
        // Don't completely fail the whole flow for auth update problems; inform the admin with details
        showAlertMessage('warning', 'Profile updated but password update failed: ' + (err.message || 'Unknown error'));
        // Continue with the rest of the update process
      }
    }

    // Handle user creation/editing based on type
    if (activeTab === 'admins' || activeTab === 'teachers') {
      if (modalAction.type === 'create') {
        // Create new teacher/admin profile
        const profileData = {
          id: authData.user.id,
          first_name: formData.firstname.trim(),
          middle_name: formData.middlename?.trim() || null,
          last_name: formData.lastname.trim(),
          username: formData.emailaddress.split('@')[0],
          email: formData.emailaddress?.trim() || null,
          contact: formData.contactnumber?.trim() || null,
          role: activeTab === 'admins' ? 'admin' : 'teacher',
          is_active: true
          // Note: contact_number is not stored in user_profiles table
          // created_at and updated_at are handled by database defaults
        };

      try {
        
        // Create the profile
        const { error: insertError } = await supabaseAdmin
          .from('user_profiles')
          .insert([profileData]);


        if (insertError) {

          // If the insert failed due to a duplicate username constraint, try a safe fallback username
          const errMsg = insertError.message || JSON.stringify(insertError);
          if (errMsg.toLowerCase().includes('duplicate') || errMsg.toLowerCase().includes('unique') || errMsg.toLowerCase().includes('username')) {
            const baseUsername = (formData.emailaddress || '').split('@')[0] || `user${Date.now().toString().slice(-4)}`;
            const fallbackUsername = `${baseUsername}_${Date.now().toString().slice(-4)}`;

            const fallbackProfile = { ...profileData, username: fallbackUsername };
            const { error: secondError } = await supabaseAdmin
              .from('user_profiles')
              .insert([fallbackProfile]);

            if (secondError) {
              // cleanup auth user on failure
              try { await supabaseAdmin.auth.admin.deleteUser(authData.user.id); } catch (cleanupErr) { console.error('Cleanup error:', cleanupErr); }
              throw new Error(`Failed to create ${activeTab.slice(0, -1)} profile after retry: ${secondError.message || JSON.stringify(secondError)}`);
            }
          } else {
            // If profile creation fails for other reasons, clean up the auth user
            try { await supabaseAdmin.auth.admin.deleteUser(authData.user.id); } catch (cleanupErr) { console.error('Cleanup error:', cleanupErr); }
            throw new Error(`Failed to create ${activeTab.slice(0, -1)} profile: ${insertError.message || JSON.stringify(insertError)}`);
          }
        }
      } catch (error) {
        // Clean up auth user on any unexpected error
        try { await supabaseAdmin.auth.admin.deleteUser(authData.user.id); } catch (cleanupErr) { console.error('Cleanup error:', cleanupErr); }
        throw error;
      }
      
      } else {
        // Edit existing teacher/admin
        
        const updateData = {
          first_name: formData.firstname.trim(),
          middle_name: formData.middlename?.trim() || undefined,
          last_name: formData.lastname.trim(),
          email: formData.emailaddress?.trim() || undefined,
          contact: formData.contactnumber?.trim() || undefined,
          updated_at: new Date().toISOString()
        };
        
        
        // Only update username if email address changed
        if (formData.emailaddress) {
          updateData.username = formData.emailaddress.split('@')[0];
        }
        
        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from('user_profiles')
          .update(updateData)
          .eq('id', formData.id)
          .select()
          .maybeSingle();

        if (updateError) {
          throw new Error(`Failed to update ${activeTab.slice(0, -1)} profile: ${updateError.message || JSON.stringify(updateError)}`);
        }

      }

    } else if (activeTab === 'students') {
      if (modalAction.type === 'create') {
        // Creating new student - create parent with auth account first
        let parentId;
        
        // Check if parent already exists by email
        const { data: existingParent, error: parentLookupError } = await supabaseAdmin
          .from('user_profiles')
          .select('id')
          .eq('role', 'parent')
          .eq('username', formData.emailaddress.split('@')[0])
          .maybeSingle();
        
        if (parentLookupError) throw parentLookupError;
        
        if (existingParent && existingParent.id) {
          // Use existing parent
          parentId = existingParent.id;
        } else {
          // Create new parent with auth account
          parentId = authData.user.id;
          const parentProfile = {
            id: parentId,
            role: 'parent',
            username: formData.emailaddress.split('@')[0],
            first_name: formData.parentfirstname.trim(),
            middle_name: formData.parentmiddlename?.trim() || null,
            last_name: formData.parentlastname.trim(),
            email: formData.emailaddress?.trim() || null,
            contact: formData.contactnumber?.trim() || null,
            is_active: true
            // created_at and updated_at are handled by database defaults
          };
          
          const { error: parentError } = await supabaseAdmin
            .from('user_profiles')
            .insert([parentProfile]);
          if (parentError) throw new Error('Failed to create parent profile: ' + parentError.message);
              // After creating the parent profile, send a password reset / invite email so the parent can set their password and verify their account.
              try {
                // Use the anon client to send a magic-link (OTP) sign-in email so the parent can log in directly
                const { data: otpData, error: otpErr } = await supabase.auth.signInWithOtp({
                  email: formData.emailaddress,
                  options: { emailRedirectTo: `${window.location.origin}/login` }
                });
                if (otpErr) {
                  showAlertMessage('warning', 'Parent created but login email could not be sent automatically.');
                } else {
                  showAlertMessage('success', 'Parent created and login link sent to their email.');
                }
              } catch (e) {
                showAlertMessage('warning', 'Parent created but failed to send login email (see console).');
              }
        }

        // Generate next student ID
        const { data: maxStudent, error: maxStudentError } = await supabaseAdmin
          .from('students')
          .select('student_id')
          .order('student_id', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (maxStudentError) throw maxStudentError;
        
        let nextNumber = 1;
        if (maxStudent && maxStudent.student_id) {
          const match = maxStudent.student_id.match(/STU(\d{3})/);
          if (match) nextNumber = parseInt(match[1], 10) + 1;
        }
        const studentId = `STU${String(nextNumber).padStart(3, '0')}`;
        
        // Create student record
  const today = new Date();
  // Accept either formData.date_of_birth (AddChildForm) or formData.birthdate (UserForm)
  const rawBirth = formData.date_of_birth ?? formData.birthdate ?? '';
  const birthDate = rawBirth ? new Date(rawBirth) : null;
  const rawEnroll = formData.enrollment_date ?? formData.enrollmentDate ?? '';
  const enrollmentDate = rawEnroll ? new Date(rawEnroll) : today;
        
        const studentProfile = {
          id: crypto.randomUUID(),
          parent_id: parentId,
          first_name: formData.firstname.trim(),
          middle_name: formData.middlename?.trim() || null,
          last_name: formData.lastname.trim(),
          date_of_birth: birthDate ? birthDate.toISOString().split('T')[0] : null,
          student_id: studentId,
          enrollment_date: enrollmentDate.toISOString().split('T')[0],
          created_at: today.toISOString(),
        };
        
        const { error: studentError } = await supabaseAdmin
          .from('students')
          .insert([studentProfile]);
        if (studentError) throw new Error('Failed to create student record: ' + studentError.message);
        
      } else {
        // If the modal was opened to edit a parent (parents are shown under the 'students' tab),
        // persist the name change to the user_profiles table instead of students.
        if (modalAction?.data?.role === 'parent') {
          const profileUpdate = {
            first_name: formData.firstname?.trim(),
            // send either a trimmed string or explicit null so DB stores the value
            middle_name: (typeof formData.middlename === 'string' ? (formData.middlename.trim() || null) : undefined),
            last_name: formData.lastname?.trim(),
            email: formData.emailaddress?.trim() || undefined,
            contact: formData.contactnumber?.trim() || undefined,
          };
            const { data: updatedProfile, error: profileUpdateError } = await supabaseAdmin
              .from('user_profiles')
              .update(profileUpdate)
              .eq('id', formData.id)
              .select()
              .maybeSingle();
            if (profileUpdateError) {
              throw new Error('Failed to update parent profile: ' + (profileUpdateError.message || JSON.stringify(profileUpdateError)));
            }
        } else {
          // Editing existing student
          const rawBirthUpdate = formData.date_of_birth ?? formData.birthdate ?? '';
          const rawEnrollUpdate = formData.enrollment_date ?? formData.enrollmentDate ?? '';
          const updateData = {
            first_name: formData.firstname.trim(),
            middle_name: formData.middlename?.trim() || undefined,
            last_name: formData.lastname.trim(),
            date_of_birth: rawBirthUpdate ? new Date(rawBirthUpdate).toISOString().split('T')[0] : null,
            enrollment_date: rawEnrollUpdate ? new Date(rawEnrollUpdate).toISOString().split('T')[0] : null,
          };

          const { error: updateError } = await supabaseAdmin
            .from('students')
            .update(updateData)
            .eq('id', formData.id);
          if (updateError) throw new Error('Failed to update student: ' + updateError.message);

          // Update parent information if provided (when editing a student and parent fields are present)
          if (formData.parentfirstname && formData.parentlastname) {
            const parentUpdateData = {
              first_name: formData.parentfirstname.trim(),
              middle_name: formData.parentmiddlename?.trim() || undefined,
              last_name: formData.parentlastname.trim(),
              email: formData.emailaddress?.trim() || undefined,
              contact: formData.contactnumber?.trim() || undefined,
            };

            const { error: parentUpdateError } = await supabaseAdmin
              .from('user_profiles')
              .update(parentUpdateData)
              .eq('id', formData.parent_id);
            if (parentUpdateError) throw new Error('Failed to update parent: ' + parentUpdateError.message);
          }
        }
      }
    }

    const successMessage = modalAction.type === 'create' 
      ? `${activeTab.slice(0, -1)} created successfully! ${activeTab === 'students' ? 'Parent will receive email verification.' : 'Please check email to verify account. If you do not receive an email, contact support.'}`
      : `${activeTab.slice(0, -1)} updated successfully!`;
    
    showAlertMessage('success', successMessage);
  // Show themed toast as well
  setAdminToastEntity(activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1));
  setAdminToastType('success');
  setAdminToastMessage(successMessage);
  setShowAdminToast(true);
    setRefreshKey(prev => prev + 1);
    handleCloseModal();
    
  } catch (error) {
    
    // Show detailed error message
    const errorMessage = error.message || error.toString() || 'Unknown error occurred';
    const fullErrorMsg = `Failed to ${modalAction.type} ${activeTab.slice(0, -1)}: ${errorMessage}`;
    
    showAlertMessage('danger', fullErrorMsg);
    setAdminToastType('danger');
    setAdminToastMessage(fullErrorMsg);
    setAdminToastEntity(activeTab.slice(0, -1).charAt(0).toUpperCase() + activeTab.slice(1, -1));
    setShowAdminToast(true);
    handleCloseModal();
  }
};
  // Accepts either an event (from the form) or a plain object (child data)
  const handleAddChild = async (eOrData) => {
    let dataObj;
    if (eOrData && typeof eOrData.preventDefault === 'function') {
      eOrData.preventDefault();
      const fd = new FormData(eOrData.target);
      dataObj = {
        firstname: fd.get('firstname'),
        middlename: fd.get('middlename'),
        lastname: fd.get('lastname'),
        date_of_birth: fd.get('date_of_birth'),
        enrollment_date: fd.get('enrollment_date')
      };
    } else {
      dataObj = eOrData || childForm;
    }

    // Basic client-side validation
    const errors = {};
    if (!dataObj.firstname || !String(dataObj.firstname).trim()) errors.firstname = 'First name is required';
    if (!dataObj.lastname || !String(dataObj.lastname).trim()) errors.lastname = 'Last name is required';
    if (!dataObj.date_of_birth) errors.date_of_birth = 'Birth date is required';
    if (!dataObj.enrollment_date) errors.enrollment_date = 'Enrollment date is required';
    // Date sanity checks
    if (dataObj.date_of_birth) {
      const dob = new Date(dataObj.date_of_birth);
      const today = new Date(todayStr);
      if (isNaN(dob.getTime())) errors.date_of_birth = 'Invalid birth date';
      else if (dob > today) errors.date_of_birth = 'Birth date cannot be in the future';
    }
    if (dataObj.enrollment_date && dataObj.date_of_birth) {
      const dob = new Date(dataObj.date_of_birth);
      const enroll = new Date(dataObj.enrollment_date);
      const today = new Date(todayStr);
      if (isNaN(enroll.getTime())) errors.enrollment_date = 'Invalid enrollment date';
      else if (enroll < dob) errors.enrollment_date = 'Enrollment date cannot be before birth date';
      else if (enroll > today) errors.enrollment_date = 'Enrollment date cannot be in the future';
    }
    if (Object.keys(errors).length > 0) {
      setChildErrors(errors);
      showAlertMessage('danger', Object.values(errors).join(', '));
      return;
    }

    try {
      // Generate next student ID from DB
      const { data: maxStudent, error: maxStudentError } = await supabaseAdmin
        .from('students')
        .select('student_id')
        .order('student_id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (maxStudentError) throw maxStudentError;

      let nextNumber = 1;
      if (maxStudent && maxStudent.student_id) {
        const match = maxStudent.student_id.match(/STU(\d{3})/);
        if (match) nextNumber = parseInt(match[1], 10) + 1;
      }
      const studentId = `STU${String(nextNumber).padStart(3, '0')}`;

      // Create student record
      const studentData = {
        id: crypto.randomUUID(),
        parent_id: selectedUser.id,
        first_name: String(dataObj.firstname).trim(),
        middle_name: dataObj.middlename?.trim() || null,
        last_name: String(dataObj.lastname).trim(),
        date_of_birth: dataObj.date_of_birth || null,
        student_id: studentId,
        enrollment_date: dataObj.enrollment_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabaseAdmin
        .from('students')
        .insert([studentData]);

      if (insertError) throw insertError;

  showAlertMessage('success', 'Child added successfully!');
  setAdminToastEntity('Child');
  setAdminToastType('success');
  setAdminToastMessage('Child added successfully!');
  setShowAdminToast(true);
  setShowAddChildModal(false);
  setChildForm({ firstname: '', middlename: '', lastname: '', date_of_birth: '', enrollment_date: '' });
  setChildErrors({});
  setRefreshKey(prev => prev + 1); // Refresh the list
    } catch (error) {
  showAlertMessage('danger', 'Failed to add child: ' + error.message);
  setAdminToastType('danger');
  setAdminToastMessage('Failed to add child: ' + error.message);
  setAdminToastEntity('Child');
  setShowAdminToast(true);
    }
  };

  // Handle deleting a child
  const handleDeleteChild = (child) => {
    setModalAction({ type: 'delete', data: { ...child, role: 'student' } });
    setShowDeleteModal(true);
  };

  // Handle editing a child
  const handleEditChild = (child) => {
    setSelectedChild(child);
    setEditChildForm({
      firstname: child.first_name || '',
      middlename: child.middle_name || child.middlename || '',
      lastname: child.last_name || '',
      date_of_birth: child.date_of_birth || '',
      enrollment_date: child.enrollment_date || ''
    });
    setEditChildErrors({});
    setShowEditChildModal(true);
  };

  // Handle updating a child
  const handleUpdateChild = async (formData) => {
    // Validate form data
    const errors = {};
    if (!formData.firstname?.trim()) errors.firstname = 'First name is required';
    if (!formData.lastname?.trim()) errors.lastname = 'Last name is required';
    if (!formData.date_of_birth) errors.date_of_birth = 'Birth date is required';
    if (!formData.enrollment_date) errors.enrollment_date = 'Enrollment date is required';
    // Middle name is optional, so no validation needed

    if (Object.keys(errors).length > 0) {
      setEditChildErrors(errors);
      return;
    }

    try {
      const { error } = await supabaseAdmin
        .from('students')
        .update({
          first_name: formData.firstname.trim(),
          middle_name: formData.middlename?.trim() || undefined,
          last_name: formData.lastname.trim(),
          date_of_birth: formData.date_of_birth || null,
          enrollment_date: formData.enrollment_date || null
        })
        .eq('id', selectedChild.id);

      if (error) throw error;

  showAlertMessage('success', 'Child updated successfully!');
  setAdminToastEntity('Child');
  setAdminToastType('success');
  setAdminToastMessage('Child updated successfully!');
  setShowAdminToast(true);
      setShowEditChildModal(false);
      setEditChildForm({ firstname: '', middlename: '', lastname: '', date_of_birth: '', enrollment_date: '' });
      setEditChildErrors({});
      setSelectedChild(null);
      setRefreshKey(prev => prev + 1); // Refresh the list
    } catch (error) {
  showAlertMessage('danger', 'Failed to update child: ' + error.message);
  setAdminToastType('danger');
  setAdminToastMessage('Failed to update child: ' + error.message);
  setAdminToastEntity('Child');
  setShowAdminToast(true);
    }
  };

  const handleDelete = async (user) => {
    try {
      let tableToUse = 'user_profiles';
      let idField = 'id';
      let isStudent = false;
      
      // Determine if this is a student (child) deletion
      if (user.role === 'student' || (activeTab === 'students' && !user.role)) {
        tableToUse = 'students';
        idField = 'id';
        isStudent = true;
      } else if (activeTab === 'students' && user.role === 'parent') {
        // If deleting a parent from the student list, ensure correct table
        tableToUse = 'user_profiles';
        idField = 'id';
      }

      // Delete user from the specific table
      const { error: deleteError } = await supabaseAdmin
        .from(tableToUse)
        .delete()
        .eq(idField, user.id);

      if (deleteError) throw deleteError;

      // Delete user from auth only if user is not a student/child
      if (!isStudent) {
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (authError && !String(authError.message).includes('User not found')) throw authError;
      }

      const entityType = isStudent ? 'Child' : activeTab.slice(0, -1);
  showAlertMessage('success', `${entityType} deleted successfully`);
  setAdminToastEntity(entityType);
  setAdminToastType('success');
  setAdminToastMessage(`${entityType} deleted successfully`);
  setShowAdminToast(true);
      setRefreshKey(prev => prev + 1); // Force refresh
    } catch (error) {
  showAlertMessage('danger', `Failed to delete: ${error.message}`);
  setAdminToastType('danger');
  setAdminToastMessage(`Failed to delete: ${error.message}`);
  setAdminToastEntity('User');
  setShowAdminToast(true);
    }
    handleCloseModal();
  };

  // Confirm delete wrapper that handles single deletes and bulk deletes
  const confirmDelete = async () => {
    try {
      if (modalAction.type === 'bulk-delete' && Array.isArray(modalAction.data)) {
        await handleBulkDelete(modalAction.data);
      } else {
        await handleDelete(modalAction.data);
      }
    } catch (err) {
      showAlertMessage('danger', 'Delete operation failed: ' + (err.message || String(err)));
    } finally {
      // ensure modal is closed and modalAction cleared
      handleCloseDeleteModal();
    }
  };

  // Bulk delete by ids (array of user_profile ids). Safe steps:
  // 1) delete students that belong to these parents (if any)
  // 2) delete user_profiles rows
  // 3) attempt to delete auth users for each id (ignore not-found errors)
  const handleBulkDelete = async (ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    try {
      // Delete students with parent_id in ids first to avoid FK issues
      const { error: delStudentsErr } = await supabaseAdmin
        .from('students')
        .delete()
        .in('parent_id', ids);
      if (delStudentsErr) {
        // Log but continue to attempt profile deletion — surface error to user later
      }

      // Delete profiles
      const { error: delProfilesErr } = await supabaseAdmin
        .from('user_profiles')
        .delete()
        .in('id', ids);
      if (delProfilesErr) throw delProfilesErr;

      // Attempt to delete auth users (best-effort). Some ids may not map to auth users.
      for (const id of ids) {
        try {
          const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id);
          if (authErr && !String(authErr.message).includes('User not found')) {
          }
        } catch (e) {
        }
      }

      showAlertMessage('success', `Deleted ${ids.length} item(s) successfully.`);
      setAdminToastEntity('Users');
      setAdminToastType('success');
      setAdminToastMessage(`Deleted ${ids.length} item(s) successfully.`);
      setShowAdminToast(true);
      // Refresh list and clear selection
      setRefreshKey(prev => prev + 1);
      setSelectedIds(new Set());
      setSelectAllOnPage(false);
    } catch (error) {
      throw new Error(error.message || 'Bulk delete failed');
    }
  };

  // Export selected rows (by ids) to CSV and trigger download
  const handleExportSelected = async (ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      showAlertMessage('warning', 'No rows selected for export');
      return;
    }
    try {
      // Fetch profiles for the selected ids
      const { data: rows, error } = await supabaseAdmin
        .from('user_profiles')
        .select('id, username, first_name, middle_name, last_name, email, contact, role, created_at')
        .in('id', ids);
      if (error) throw error;

      // Build CSV
      const headers = ['id', 'username', 'first_name', 'middle_name', 'last_name', 'email', 'contact', 'role', 'created_at'];
      const csvLines = [headers.join(',')];
      for (const r of rows) {
        const line = headers.map(h => {
          const v = r[h] === null || r[h] === undefined ? '' : String(r[h]);
          // Escape quotes and commas
          return `"${v.replace(/"/g, '""')}"`;
        }).join(',');
        csvLines.push(line);
      }
      const csvContent = csvLines.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      showAlertMessage('success', `Exported ${rows.length} row(s) to CSV`);
    } catch (err) {
      showAlertMessage('danger', 'Export failed: ' + (err.message || String(err)));
    }
  };

  // Export selected profiles as a PDF using html2canvas + jsPDF (modeled after ClassroomPage)
  const handleExportPDF = async (ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) {
      showAlertMessage('warning', 'No rows selected for export');
      return;
    }
    try {
      const { data: rows, error } = await supabaseAdmin
        .from('user_profiles')
        .select('id, username, first_name, middle_name, last_name, email, contact, role, created_at')
        .in('id', ids);
      if (error) throw error;

      // Professional PDF export with enhanced styling and branding
      const sectionName = 'Selected_Users';
      const container = document.createElement('div');
      container.style.padding = '15px';
      container.style.fontFamily = '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
      container.style.width = '100%';
      container.style.maxWidth = '1200px';
      container.style.color = '#2c3e50';
      container.style.backgroundColor = '#ffffff';

      // Company Header Section
      const companyHeader = document.createElement('div');
      companyHeader.style.borderBottom = '3px solid #3498db';
      companyHeader.style.paddingBottom = '15px';
      companyHeader.style.marginBottom = '20px';

      const headerTop = document.createElement('div');
      headerTop.style.display = 'flex';
      headerTop.style.justifyContent = 'space-between';
      headerTop.style.alignItems = 'center';

      const logoSection = document.createElement('div');
      logoSection.style.display = 'flex';
      logoSection.style.alignItems = 'center';

      const logo = new Image();
      logo.src = `${window.location.origin}/images/logo.png`;
      logo.style.height = '50px';
      logo.style.objectFit = 'contain';
      logo.style.marginRight = '15px';

      const companyInfo = document.createElement('div');
      const companyName = document.createElement('h1');
      companyName.textContent = 'AugmentED Learning System';
      companyName.style.margin = '0';
      companyName.style.fontSize = '18px';
      companyName.style.fontWeight = 'bold';
      companyName.style.color = '#2c3e50';

      const companySubtitle = document.createElement('p');
      companySubtitle.textContent = 'Student Information Management';
      companySubtitle.style.margin = '0';
      companySubtitle.style.fontSize = '12px';
      companySubtitle.style.color = '#7f8c8d';
      companySubtitle.style.fontStyle = 'italic';

      companyInfo.appendChild(companyName);
      companyInfo.appendChild(companySubtitle);
      logoSection.appendChild(logo);
      logoSection.appendChild(companyInfo);

      const reportInfo = document.createElement('div');
      reportInfo.style.textAlign = 'right';

      const reportTitle = document.createElement('h2');
      reportTitle.textContent = 'USER EXPORT REPORT';
      reportTitle.style.margin = '0';
      reportTitle.style.fontSize = '16px';
      reportTitle.style.fontWeight = 'bold';
      reportTitle.style.color = '#34495e';

      const dateInfo = document.createElement('div');
      dateInfo.style.marginTop = '8px';
      dateInfo.style.fontSize = '11px';
      dateInfo.style.color = '#7f8c8d';

      const generateDate = document.createElement('p');
      generateDate.textContent = `Generated: ${new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}`;
      generateDate.style.margin = '0';

      const generateTime = document.createElement('p');
      generateTime.textContent = `Time: ${new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      })}`;
      generateTime.style.margin = '0';

      dateInfo.appendChild(generateDate);
      dateInfo.appendChild(generateTime);
      reportInfo.appendChild(reportTitle);
      reportInfo.appendChild(dateInfo);

      headerTop.appendChild(logoSection);
      headerTop.appendChild(reportInfo);
      companyHeader.appendChild(headerTop);
      container.appendChild(companyHeader);      // Table
      const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';
  table.style.tableLayout = 'fixed';
  table.style.marginBottom = '4px';

      const thead = document.createElement('thead');
      const trHead = document.createElement('tr');
  const cols = ['Parent ID','Username','Name','Email','Contact','Role','Created At'];
  // Reduce Name width, increase Email width, tighten remaining columns
  const colWidths = ['6%','12%','28%','36%','8%','6%','4%'];
      cols.forEach((c,i) => {
  const th = document.createElement('th');
        th.textContent = c;
        th.style.background = '#f2f2f2';
        th.style.border = '1px solid #ddd';
  th.style.padding = '4px';
  th.style.fontSize = '9px';
        th.style.textAlign = 'left';
        th.style.width = colWidths[i];
        trHead.appendChild(th);
      });
      thead.appendChild(trHead);
      table.appendChild(thead);

      const tbody = document.createElement('tbody');
      rows.forEach((r, idx) => {
        const tr = document.createElement('tr');
        const name = `${r.first_name || ''}${r.middle_name ? ' ' + r.middle_name : ''}${r.last_name ? ' ' + r.last_name : ''}`.trim();
        const values = [String(idx + 1), r.username || '', name || '', r.email || '', r.contact || '', r.role || '', (r.created_at || '').split('T')[0]];
        values.forEach((v, cellIdx) => {
          const td = document.createElement('td');
          const text = (v || '').toString().trim();
          td.textContent = text;
          td.style.border = '1px solid #ddd';
          td.style.padding = '3px 5px';
          td.style.fontSize = '9px';
          td.style.wordBreak = 'break-word';
          td.style.whiteSpace = 'normal';
          td.style.overflowWrap = 'anywhere';
          td.style.lineHeight = '1.3';
          td.style.color = '#2c3e50';
          
          // Special styling for role column
          if (cellIdx === 5 && text) {
            const roleColors = {
              'Parent': '#e74c3c',
              'Teacher': '#27ae60',
              'Admin': '#3498db',
              'Student': '#f39c12'
            };
            const roleColor = roleColors[text] || '#7f8c8d';
            td.style.color = roleColor;
            td.style.fontWeight = '600';
          }
          
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      // Ensure tableSection exists (created earlier in refactor). If not, create it.
      let tableSectionRef = null;
      try {
        // try to reference existing variable
        tableSectionRef = tableSection;
      } catch (e) {
        tableSectionRef = null;
      }
      if (!tableSectionRef) {
        tableSectionRef = document.createElement('div');
        tableSectionRef.style.marginBottom = '20px';
      }
      tableSectionRef.appendChild(table);
      container.appendChild(tableSectionRef);

      // Professional Summary Section
      const summarySection = document.createElement('div');
      summarySection.style.marginTop = '20px';
      summarySection.style.padding = '15px';
      summarySection.style.backgroundColor = '#f8f9fa';
      summarySection.style.borderRadius = '6px';
      summarySection.style.border = '1px solid #e9ecef';

      const summaryTitle = document.createElement('h4');
      summaryTitle.textContent = 'Report Summary';
      summaryTitle.style.margin = '0 0 10px 0';
      summaryTitle.style.fontSize = '12px';
      summaryTitle.style.fontWeight = '600';
      summaryTitle.style.color = '#2c3e50';

      const summaryGrid = document.createElement('div');
      summaryGrid.style.display = 'grid';
      summaryGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
      summaryGrid.style.gap = '15px';

      // Count by role
      const roleCounts = rows.reduce((acc, row) => {
        const role = (row.role || '').charAt(0).toUpperCase() + (row.role || '').slice(1);
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      const totalItem = document.createElement('div');
      totalItem.innerHTML = `
        <div style="font-size: 11px; color: #7f8c8d; margin-bottom: 4px;">Total Users</div>
        <div style="font-size: 18px; font-weight: bold; color: #2c3e50;">${rows.length}</div>
      `;

      const rolesItem = document.createElement('div');
      const rolesList = Object.entries(roleCounts).map(([role, count]) => 
        `<span style="color: #34495e;">${role}: ${count}</span>`
      ).join(' | ');
      rolesItem.innerHTML = `
        <div style="font-size: 11px; color: #7f8c8d; margin-bottom: 4px;">By Role</div>
        <div style="font-size: 10px; line-height: 1.4;">${rolesList}</div>
      `;

      const exportInfo = document.createElement('div');
      exportInfo.innerHTML = `
        <div style="font-size: 11px; color: #7f8c8d; margin-bottom: 4px;">Export Info</div>
        <div style="font-size: 10px; color: #34495e;">Format: PDF</div>
        <div style="font-size: 10px; color: #34495e;">Source: Admin Panel</div>
      `;

      summaryGrid.appendChild(totalItem);
      summaryGrid.appendChild(rolesItem);
      summaryGrid.appendChild(exportInfo);
      summarySection.appendChild(summaryTitle);
      summarySection.appendChild(summaryGrid);
      container.appendChild(summarySection);

      // Professional Footer
      const footer = document.createElement('div');
      footer.style.marginTop = '25px';
      footer.style.paddingTop = '15px';
      footer.style.borderTop = '2px solid #ecf0f1';
      footer.style.textAlign = 'center';

      const footerContent = document.createElement('div');
      footerContent.style.display = 'flex';
      footerContent.style.justifyContent = 'space-between';
      footerContent.style.alignItems = 'center';
      footerContent.style.fontSize = '9px';
      footerContent.style.color = '#7f8c8d';

      const confidential = document.createElement('div');
      confidential.innerHTML = `
        <div style="font-weight: 600; color: #e74c3c;">CONFIDENTIAL</div>
        <div>This document contains sensitive information</div>
      `;

      const timestamp = document.createElement('div');
      timestamp.style.textAlign = 'center';
      timestamp.innerHTML = `
        <div style="font-weight: 600;">AugmentED Learning System</div>
        <div>Generated: ${new Date().toLocaleString('en-US', { 
          dateStyle: 'medium', 
          timeStyle: 'short' 
        })}</div>
      `;

      const pageInfo = document.createElement('div');
      pageInfo.style.textAlign = 'right';
      pageInfo.innerHTML = `
        <div>Document Version: 1.0</div>
        <div>Format: PDF Export</div>
      `;

      footerContent.appendChild(confidential);
      footerContent.appendChild(timestamp);
      footerContent.appendChild(pageInfo);
      footer.appendChild(footerContent);
      container.appendChild(footer);

      document.body.appendChild(container);

      // Render to canvas then split into pages
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false, allowTaint: true });
      const imgWidthMm = 210; // A4 width in mm
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Calculate pixel/mm ratio
      const pxPerMm = canvas.width / imgWidthMm;
      const pageHeightMm = pdf.internal.pageSize.getHeight();
      const pageHeightPx = Math.floor(pageHeightMm * pxPerMm);

      let y = 0;
      let pageCount = 0;
      while (y < canvas.height) {
        const sliceHeight = Math.min(pageHeightPx, canvas.height - y);
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = canvas.width;
        tmpCanvas.height = sliceHeight;
        const ctx = tmpCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, y, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

        const imgData = tmpCanvas.toDataURL('image/png');
        const imgHeightMm = sliceHeight / pxPerMm;

        if (pageCount > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm);
        y += sliceHeight;
        pageCount += 1;
      }

      pdf.save(`User_Export_${sectionName}_${new Date().toISOString().slice(0,10)}.pdf`);
      document.body.removeChild(container);
      showAlertMessage('success', `PDF exported (${rows.length} rows, ${pageCount} page(s))`);
    } catch (err) {
      showAlertMessage('danger', 'Export PDF failed: ' + (err.message || String(err)));
    }
  };

  const handleRowClick = (user) => {
    setSelectedUser(user === selectedUser ? null : user);

    // Add a small delay to ensure the details are rendered before scrolling
    if (user !== selectedUser) {
      setTimeout(() => {
        const element = document.querySelector('.details-row');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }; const renderUserTable = (users, type) => (
    <div className="table-wrapper" style={{
      overflowY: 'auto',
      overflowX: 'auto',
      flex: isMobile ? 'none' : 1,
      position: 'relative',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
      maxHeight: isMobile ? '60vh' : 'calc(100vh - 450px)',
      minHeight: isMobile ? '400px' : '400px',
      marginBottom: isMobile ? '1rem' : '0'
    }}>
      {/* Removed debug logging for student section names */}
      {activeTab === 'students' && (
        <>
          {/* Bulk toolbar */}
          {selectedIds.size > 0 && (
            <div className="bulk-toolbar d-flex justify-content-between align-items-center mb-2" style={{ marginBottom: '0.25rem', transform: 'translateY(6px)' }}>
              <style>{`
                .bulk-toolbar .btn-csv { color: ${colors.success}; border: 1px solid transparent; background: transparent; }
                .bulk-toolbar .btn-csv:hover { background: rgba(40,199,111,0.08); border-color: rgba(40,199,111,0.12); }
                .bulk-toolbar .btn-pdf { color: ${colors.primary}; border: 1px solid transparent; background: transparent; }
                .bulk-toolbar .btn-pdf:hover { background: rgba(0,102,254,0.06); border-color: rgba(0,102,254,0.10); }
                .bulk-toolbar .btn-clear { color: ${colors.success}; border: 1px solid transparent; background: transparent; }
                .bulk-toolbar .btn-clear:hover { background: rgba(40,199,111,0.06); border-color: rgba(40,199,111,0.10); }
                .bulk-toolbar .btn-delete { color: ${colors.danger}; border: 1px solid transparent; background: transparent; }
                .bulk-toolbar .btn-delete:hover { background: rgba(234,84,85,0.06); border-color: rgba(234,84,85,0.10); }
              `}</style>
              <div>{selectedIds.size} selected</div>
              <div className="d-flex gap-2">
                <Button size="sm" className="btn-csv" onClick={() => handleExportSelected([...selectedIds])}>Export CSV</Button>
                <Button size="sm" className="btn-pdf" onClick={() => handleExportPDF([...selectedIds])}>Export PDF</Button>
                <Button size="sm" className="btn-delete" onClick={() => { setModalAction({ type: 'bulk-delete', data: [...selectedIds] }); setShowDeleteModal(true); }}>Delete Selected</Button>
                <Button size="sm" className="btn-clear" onClick={() => { setSelectedIds(new Set()); setSelectAllOnPage(false); }}>Clear</Button>
              </div>
            </div>
          )}
          <Table bordered hover responsive className="mt-3 pretty-table" style={{ borderRadius: '16px', boxShadow: '0 4px 16px rgba(33,147,176,0.08)' }}>
            <thead style={{ background: 'linear-gradient(90deg, #f3fafd 80%, #eaf6fb 100%)', borderRadius: '16px' }}>
              <tr>
                <th style={{ backgroundColor: '#f3fafd', borderTopLeftRadius: '16px', width: 48 }}>
                  <input
                    type="checkbox"
                    checked={users.length > 0 && users.every(u => selectedIds.has(u.id))}
                    onChange={(e) => {
                      const newSet = new Set(selectedIds);
                      if (e.target.checked) {
                        users.forEach(u => newSet.add(u.id));
                        setSelectAllOnPage(true);
                      } else {
                        users.forEach(u => newSet.delete(u.id));
                        setSelectAllOnPage(false);
                      }
                      setSelectedIds(newSet);
                    }}
                    aria-label="Select all on page"
                  />
                </th>
                <th style={{ backgroundColor: '#f3fafd' }}>Parent ID</th>
                <th style={{ backgroundColor: '#f3fafd' }}>Name</th>
                <th style={{ backgroundColor: '#f3fafd' }}>Email</th>
                <th style={{ backgroundColor: '#f3fafd' }}>Contact</th>
                <th style={{ backgroundColor: '#f3fafd', borderTopRightRadius: '16px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((parent, idx) => (
                <React.Fragment key={parent.id}>
                  <tr style={{ background: '#f3fafd', borderRadius: '12px', cursor: 'pointer', transition: 'box-shadow 0.2s', boxShadow: '0 2px 8px rgba(33,147,176,0.05)' }} onClick={() => handleRowClick(parent)}>
                    <td style={{ width: 48 }} onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(parent.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          const newSet = new Set(selectedIds);
                          if (e.target.checked) newSet.add(parent.id);
                          else newSet.delete(parent.id);
                          setSelectedIds(newSet);
                        }}
                        onClick={(ev) => ev.stopPropagation()}
                        aria-label={`Select ${parent.first_name} ${parent.last_name}`}
                      />
                    </td>
                    <td>{idx + 1}</td>
                    <td>{parent.first_name} {parent.middle_name ? parent.middle_name + ' ' : ''}{parent.last_name}</td>
                    <td>{parent.emailaddress || parent.email}</td>
                    <td>{parent.contactnumber || parent.contact || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Button variant="outline-info" size="sm" className="edit-btn" style={{ borderRadius: '20px', background: 'transparent', marginRight: '6px' }} onClick={e => { e.stopPropagation(); handleShowModal('edit', parent); }}><FiEdit2 /></Button>
                      <Button variant="outline-danger" size="sm" className="delete-btn" style={{ borderRadius: '20px', background: 'transparent' }} onClick={e => { e.stopPropagation(); handleShowModal('delete', parent); }}><FiTrash2 /></Button>
                    </td>
                  </tr>

                  {selectedUser && selectedUser.id === parent.id && parent.role === 'parent' && (
                    <tr className="details-row">
                      <td colSpan={6} style={{ padding: 0, background: 'transparent' }}>
                        <div style={{ padding: '12px 16px' }}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="mb-0">Children of {parent.first_name} {parent.last_name}</h6>
                            <div className="d-flex gap-2">
                              <Button
                                variant="light"
                                className="add-children-btn"
                                onClick={(e) => { e.stopPropagation(); setShowAddChildModal(true); }}
                                style={{ borderRadius: '16px', padding: '4px 12px', fontSize: '0.85rem', background: '#ffffff', color: colors.primary, border: 'none' }}
                              >
                                <FiUserPlus size={14} className="me-1" /> ADD CHILD
                              </Button>
                              <Button
                                variant="light"
                                className="close-children-btn"
                                onClick={(e) => { e.stopPropagation(); setSelectedUser(null); }}
                                style={{ borderRadius: '16px', padding: '4px 12px', fontSize: '0.85rem', background: '#ffffff', color: colors.danger, border: 'none' }}
                                aria-label="Close children table"
                              >
                                × Close
                              </Button>
                            </div>
                          </div>
                          <Table bordered hover responsive className="pretty-table" style={{ borderRadius: '12px', marginBottom: 0 }}>
                            <thead>
                              <tr>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Birth Date</th>
                                <th>Enrollment Date</th>
                                <th style={{ textAlign: 'center' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {students.filter(s => s.parent_id === parent.id).map(child => (
                                <tr key={child.id}>
                                  <td>{child.student_id}</td>
                                  <td>{`${child.first_name || ''}${child.middle_name || child.middlename ? ' ' + (child.middle_name || child.middlename) : ''} ${child.last_name || ''}`.trim()}</td>
                                  <td>{child.date_of_birth}</td>
                                  <td>{child.enrollment_date}</td>
                                  <td style={{ textAlign: 'center' }}>
                                    <Button variant="outline-info" className="edit-btn" style={{ borderRadius: '20px', padding: '6px 12px', marginRight: '6px' }} onClick={e => { e.stopPropagation(); handleEditChild(child); }}><FiEdit2 /></Button>
                                    <Button variant="outline-danger" className="delete-btn" style={{ borderRadius: '20px', padding: '6px 12px' }} onClick={e => { e.stopPropagation(); handleDeleteChild(child); }}><FiTrash2 /></Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </Table>
          
        </>
      )}

      {/* Teachers Section */}
      {activeTab === 'teachers' && (
        <Table bordered hover responsive className="mt-3 pretty-table" style={{ borderRadius: '16px', boxShadow: '0 4px 16px rgba(151,247,151,0.08)' }}>
          <thead style={{ background: 'linear-gradient(90deg, #f6fcf6 80%, #eafbe6 100%)', borderRadius: '16px' }}>
            <tr>
              <th style={{ backgroundColor: '#f6fcf6', borderTopLeftRadius: '16px' }}>Teacher ID</th>
              <th style={{ backgroundColor: '#f6fcf6' }}>Teacher Name</th>
              <th style={{ backgroundColor: '#f6fcf6' }}>Email</th>
              <th style={{ backgroundColor: '#f6fcf6' }}>Contact</th>
              <th style={{ backgroundColor: '#f6fcf6', borderTopRightRadius: '16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((teacher, idx) => (
              <tr key={teacher.id} style={{ background: '#f6fcf6', borderRadius: '12px', transition: 'box-shadow 0.2s', boxShadow: '0 2px 8px rgba(151,247,151,0.08)' }}>
                <td>{idx + 1}</td>
                <td>{teacher.first_name} {teacher.middle_name ? teacher.middle_name + ' ' : ''}{teacher.last_name}</td>
                <td>{teacher.email}</td>
                <td>{teacher.contact}</td>
                <td style={{ textAlign: 'center' }}>
                  <Button variant="outline-info" size="sm" className="edit-btn" style={{ borderRadius: '20px', background: 'transparent', marginRight: '6px' }} onClick={() => handleShowModal('edit', teacher)}><FiEdit2 /></Button>
                  <Button variant="outline-danger" size="sm" className="delete-btn" style={{ borderRadius: '20px', background: 'transparent' }} onClick={() => handleShowModal('delete', teacher)}><FiTrash2 /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Admins Section */}
      {activeTab === 'admins' && (
        <Table bordered hover responsive className="mt-3 pretty-table" style={{ borderRadius: '16px', boxShadow: '0 4px 16px rgba(67,162,206,0.08)' }}>
          <thead style={{ background: 'linear-gradient(90deg, #f5f7fd 80%, #eceffd 100%)', borderRadius: '16px' }}>
            <tr>
              <th style={{ backgroundColor: '#f5f7fd', borderTopLeftRadius: '16px' }}>Admin ID</th>
              <th style={{ backgroundColor: '#f5f7fd' }}>Admin Name</th>
              <th style={{ backgroundColor: '#f5f7fd' }}>Email</th>
              <th style={{ backgroundColor: '#f5f7fd' }}>Contact</th>
              <th style={{ backgroundColor: '#f5f7fd', borderTopRightRadius: '16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((admin, idx) => (
              <tr key={admin.id} style={{ background: '#f5f7fd', borderRadius: '12px', transition: 'box-shadow 0.2s', boxShadow: '0 2px 8px rgba(67,162,206,0.08)' }}>
                <td>{idx + 1}</td>
                <td>{admin.first_name} {admin.middle_name ? admin.middle_name + ' ' : ''}{admin.last_name}</td>
                <td>{admin.email}</td>
                <td>{admin.contact}</td>
                <td style={{ textAlign: 'center' }}>
                  <Button variant="outline-info" size="sm" className="edit-btn" style={{ borderRadius: '20px', background: 'transparent', marginRight: '6px' }} onClick={() => handleShowModal('edit', admin)}><FiEdit2 /></Button>
                  <Button variant="outline-danger" size="sm" className="delete-btn" style={{ borderRadius: '20px', background: 'transparent' }} onClick={() => handleShowModal('delete', admin)}><FiTrash2 /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );

  const renderPagination = (users) => {
    const totalPages = Math.ceil(users.length / usersPerPage);
    return (
      <Pagination className="justify-content-center mt-3">
        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
        <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} />
        {[...Array(totalPages).keys()].map(page => (
          <Pagination.Item
            key={page + 1}
            active={page + 1 === currentPage}
            onClick={() => setCurrentPage(page + 1)}
          >
            {page + 1}
          </Pagination.Item>
        ))}
        <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} />
        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
      </Pagination>
    );
  };

  return (
    <div className="d-flex min-vh-100" style={{
      background: `
        radial-gradient(circle at 90% 0%, rgba(123, 63, 228, 0.07) 0%, transparent 50%),
        radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 0%, transparent 70%),
        radial-gradient(circle at 80% 80%, rgba(78, 13, 209, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 20% 90%, rgba(123, 63, 228, 0.05) 0%, transparent 50%)
      `,
      backgroundAttachment: "fixed",
      backgroundSize: "cover"
    }}>
      <style>{`
        .add-children-btn {
          transition: background-color 0.18s ease, color 0.18s ease;
        }
        .add-children-btn:hover {
          background-color: ${colors.primary} !important;
          color: #ffffff !important;
        }
        .close-children-btn {
          transition: background-color 0.18s ease, color 0.18s ease;
        }
        .close-children-btn:hover {
          background-color: ${colors.danger} !important;
          color: #ffffff !important;
        }
        .edit-btn svg {
          color: ${colors.info};
          transition: color 0.12s ease, background-color 0.12s ease;
        }
        .edit-btn:hover {
          background-color: ${colors.info} !important;
        }
        .edit-btn:hover svg {
          color: #ffffff !important;
        }
        .delete-btn svg {
          color: ${colors.danger};
          transition: color 0.12s ease;
        }
        .delete-btn:hover {
          background-color: ${colors.danger} !important;
        }
        .delete-btn:hover svg {
          color: #ffffff !important;
        }
      `}</style>
      <SideMenu selectedItem="Admin" isModalOpen={showModal || showDeleteModal} />      <div style={{
        marginLeft: !isMobile ? '220px' : '0',
        width: !isMobile ? 'calc(100% - 236px)' : '100%',
        height: '100vh',
        padding: !isMobile ? '16px' : '8px',
        paddingTop: isMobile ? '60px' : '16px',
        position: 'fixed',
        top: '0',
        right: !isMobile ? '16px' : '0',
        overflow: isMobile ? 'auto' : 'hidden',
        overflowX: 'hidden',
        transition: 'all 0.3s ease',
        backgroundColor: 'transparent'
      }}><Container fluid>          <Card style={{
        height: isMobile ? 'auto' : 'calc(100vh - 32px)',
        minHeight: isMobile ? 'calc(100vh - 76px)' : 'calc(100vh - 32px)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        background: '#fff',
        borderRadius: '16px',
        overflow: isMobile ? 'visible' : 'hidden'
      }}>            <Card.Body className="p-0" style={{
        height: isMobile ? 'auto' : '100%',
        overflow: isMobile ? 'visible' : 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
          {/* Alert */}
          {/* legacy showAlert removed; admin toast will be used instead */}

          <div className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-between align-items-center'} mb-3 px-4 pt-4`}>
            <div className={isMobile ? 'text-center mb-3' : ''}>
              <h3 className={`mb-1 ${isMobile ? 'fs-5' : ''}`}>Admin Dashboard</h3>
              <p className={`text-muted mb-0 ${isMobile ? 'small' : ''}`} style={{ fontSize: isMobile ? '0.8rem' : '0.9rem' }}>Manage users, teachers, and admins</p>
            </div>
            <div style={{ width: isMobile ? '100%' : '220px' }}>
              <InputGroup size="sm">
                <Form.Control
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <InputGroup.Text>
                  <FiSearch />
                </InputGroup.Text>
              </InputGroup>
            </div>
          </div>              {/* Stats Cards */}
          <Row className={`mb-3 px-4 ${isMobile ? 'g-2' : 'g-2'}`}>
            <Col xs={12} md={3}>                  <Card style={{
              background: 'linear-gradient(45deg, rgba(255, 193, 7, 0.1), rgba(13, 110, 253, 0.05))',
              border: '1px solid rgba(255, 193, 7, 0.2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              borderRadius: '12px',
              overflow: 'hidden'
            }}><Card.Body style={{ padding: 0, position: 'relative', minHeight: isMobile ? '70px' : '90px' }}>
                <div style={{ padding: isMobile ? '12px 70px 12px 12px' : '16px 90px 16px 16px' }}>
                  <div>
                    <h6 className={`text-muted mb-1 ${isMobile ? 'small' : ''}`}>Parents</h6>
                    <h3 className={`mb-0 ${isMobile ? 'fs-5' : ''}`}>{parentCount}</h3>                        </div>
                  <div style={{ width: isMobile ? '60px' : '90px', position: 'absolute', right: 0, top: 0, bottom: 0 }}>                          <img src={parentsImage} alt="Parents" style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    mixBlendMode: 'multiply',
                    opacity: '0.8'
                  }} />
                  </div>
                </div>
              </Card.Body>
            </Card>
            </Col>
            <Col xs={12} md={3}>                  <Card style={{
              background: 'linear-gradient(45deg, rgba(0, 207, 232, 0.1), rgba(13, 110, 253, 0.05))',
              border: '1px solid rgba(0, 207, 232, 0.2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              borderRadius: '12px',
              overflow: 'hidden'
            }}><Card.Body style={{ padding: 0, position: 'relative', minHeight: isMobile ? '70px' : '90px' }}>
                <div style={{ padding: isMobile ? '12px 70px 12px 12px' : '16px 90px 16px 16px' }}>
                  <div>
                    <h6 className={`text-muted mb-1 ${isMobile ? 'small' : ''}`}>Students</h6>
                    <h3 className={`mb-0 ${isMobile ? 'fs-5' : ''}`}>{students.length}</h3>                        </div>
                  <div style={{ width: isMobile ? '60px' : '90px', position: 'absolute', right: 0, top: 0, bottom: 0 }}>                          <img src={studentImage} alt="Students" style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    mixBlendMode: 'multiply',
                    opacity: '0.8'
                  }} />
                  </div>
                </div>
              </Card.Body>
            </Card>
            </Col>
            <Col xs={12} md={3}>                  <Card style={{
              background: 'linear-gradient(45deg, rgba(40, 199, 111, 0.1), rgba(13, 110, 253, 0.05))',
              border: '1px solid rgba(40, 199, 111, 0.2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              borderRadius: '12px',
              overflow: 'hidden'
            }}><Card.Body style={{ padding: 0, position: 'relative', minHeight: isMobile ? '70px' : '90px' }}>
                <div style={{ padding: isMobile ? '12px 70px 12px 12px' : '16px 90px 16px 16px' }}>
                  <div>
                    <h6 className={`text-muted mb-1 ${isMobile ? 'small' : ''}`}>Teachers</h6>
                    <h3 className={`mb-0 ${isMobile ? 'fs-5' : ''}`}>{teachers.length}</h3>                        </div>
                  <div style={{ width: isMobile ? '60px' : '90px', position: 'absolute', right: 0, top: 0, bottom: 0 }}>                          <img src={teacherImage} alt="Teachers" style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    mixBlendMode: 'multiply',
                    opacity: '0.8'
                  }} />
                  </div>
                </div>
              </Card.Body>
            </Card>
            </Col>
            <Col xs={12} md={3}>                  <Card style={{
              background: 'linear-gradient(45deg, rgba(13, 110, 253, 0.1), rgba(13, 110, 253, 0.05))',
              border: '1px solid rgba(13, 110, 253, 0.2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'all 0.3s ease',
              borderRadius: '12px',
              overflow: 'hidden'
            }}><Card.Body style={{ padding: 0, position: 'relative', minHeight: isMobile ? '70px' : '90px' }}>
                <div style={{ padding: isMobile ? '12px 70px 12px 12px' : '16px 90px 16px 16px' }}>
                  <div>
                    <h6 className={`text-muted mb-1 ${isMobile ? 'small' : ''}`}>Admins</h6>
                    <h3 className={`mb-0 ${isMobile ? 'fs-5' : ''}`}>{admins.length}</h3>                        </div>
                  <div style={{ width: isMobile ? '60px' : '90px', position: 'absolute', right: 0, top: 0, bottom: 0 }}>                          <img src={adminImage} alt="Admins" style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    mixBlendMode: 'multiply',
                    opacity: '0.8'
                  }} />
                  </div>
                </div>
              </Card.Body>
            </Card>
            </Col>              </Row>              {/* Navigation */}              <Nav variant="tabs" className={`${isMobile ? 'flex-wrap' : ''} px-3 pt-2`} style={{
              borderBottom: '1px solid #dee2e6',
              gap: isMobile ? '0.25rem' : '8px'
            }}>
            {[
              { id: 'students', label: 'Students' },
              { id: 'teachers', label: 'Teachers' },
              { id: 'admins', label: 'Admins' }
            ].map((tab) => (
              <Nav.Item key={tab.id} style={{ display: 'block' }} className={isMobile ? 'flex-fill' : ''}>
                <Nav.Link
                  active={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    color: activeTab === tab.id ? colors.primary : '#6c757d',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? `2px solid ${colors.primary}` : 'none',
                    fontWeight: activeTab === tab.id ? '600' : '400',
                    display: 'block',
                    opacity: '1',
                    visibility: 'visible',
                    borderRadius: isMobile ? '20px' : '8px 8px 0 0',
                    padding: isMobile ? '0.5rem 1rem' : '0.75rem 1rem',
                    fontSize: isMobile ? '0.85rem' : '1rem',
                    textAlign: 'center',
                    marginBottom: isMobile ? '0.25rem' : '0'
                  }}
                >
                  {tab.label}
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>{/* Content Area */}              <div className={isMobile ? "p-2" : "p-4"} style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: isMobile ? 'visible' : 'hidden',
            height: isMobile ? 'auto' : 'calc(100vh - 300px)'
          }}>
            {/* Admin center-top toast (themed) */}
            <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', top: isMobile ? '60px' : '24px', zIndex: 99999 }}>
              <div style={{ minWidth: '260px', maxWidth: '520px' }}>
                <div
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  style={{ display: showAdminToast ? 'block' : 'none' }}
                >
                  <div style={{
                    background: adminToastType === 'success' ? colors.contentBg : adminToastType === 'danger' ? '#fff5f5' : '#eef2ff',
                    border: `1px solid ${adminToastType === 'success' ? '#e6f7ea' : adminToastType === 'danger' ? '#f8d7da' : '#e6e8ff'}`,
                    color: adminToastType === 'danger' ? colors.danger : '#0f172a',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: adminToastType === 'success' ? colors.success : adminToastType === 'danger' ? colors.danger : colors.info, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
                      {adminToastType === 'success' ? '✓' : adminToastType === 'danger' ? '!' : 'i'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>{adminToastEntity} {adminToastType === 'success' ? 'successful' : adminToastType === 'danger' ? 'failed' : ''}</div>
                      <div style={{ fontSize: '0.85rem', color: '#475569' }}>{adminToastMessage}</div>
                    </div>
                    <button aria-label="close-toast" onClick={() => setShowAdminToast(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 16 }}>×</button>
                  </div>
                </div>
              </div>
            </div>
            {/* Content Header */}
            <div className={`d-flex ${isMobile ? 'flex-column' : 'justify-content-between align-items-center'} mb-4`}>
              <div className={isMobile ? 'text-center mb-3' : ''}>
                <h4 className={`mb-1 ${isMobile ? 'fs-6' : ''}`}>
                  {activeTab === "students" ? "Student and Parent List" :
                    activeTab === "teachers" ? "Teachers List" : "Admins List"}
                </h4>
                <p className={`text-muted mb-0 ${isMobile ? 'small' : ''}`}>
                  {activeTab === "students" ? "Manage Pareant and Student Credentials" :
                    activeTab === "teachers" ? "Manage teacher accounts" : "Manage admin accounts"}
                </p>
              </div>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => handleShowModal('create')}
                className={isMobile ? 'w-100' : ''}
              >
                <FiPlus size={14} className="me-1" />
                CREATE ACCOUNT
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              {/* Mobile scroll hint */}
              {isMobile && (
                <div className="text-center mb-2">
                  <small className="text-muted">
                    <span style={{ fontSize: '0.7rem' }}>← Scroll horizontally to view all columns →</span>
                  </small>
                </div>
              )}

              {activeTab === "students" && (
                <>
                  {/* Removed Section Filter Dropdown */}
                  {renderUserTable(filteredParents, 'students')}
                  <div style={{ marginTop: isMobile ? '1rem' : 'auto', marginBottom: isMobile ? '1rem' : '0' }}>
                    {renderPagination(filteredStudents)}
                  </div>
                </>
              )}

              {activeTab === "teachers" && (
                <>
                  {renderUserTable(filteredTeachers, 'teachers')}
                  <div style={{ marginTop: isMobile ? '1rem' : 'auto', marginBottom: isMobile ? '1rem' : '0' }}>
                    {renderPagination(filteredTeachers)}
                  </div>
                </>
              )}

              {activeTab === "admins" && (
                <>
                  {renderUserTable(filteredAdmins, 'admins')}
                  <div style={{ marginTop: isMobile ? '1rem' : 'auto', marginBottom: isMobile ? '1rem' : '0' }}>
                    {renderPagination(filteredAdmins)}
                  </div>
                </>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
        </Container>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        onExited={handleModalExited}
        centered
        size={isMobile ? "sm" : "lg"}
        className={isMobile ? 'admin-mobile-modal' : ''}
      >
        <Modal.Header closeButton>
          <Modal.Title className={isMobile ? 'fs-6' : ''}>
            {modalAction.type === 'create' ? 'Create New Account' : `Edit ${modalAction.data?.role === 'parent' ? 'Parent' : activeTab.slice(0, -1)}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <UserForm
            type={activeTab}
            data={modalAction.data}
            modalAction={modalAction}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseModal}
            isMobile={isMobile}
          />
        </Modal.Body>
      </Modal>



      {/* Add Child Modal */}
      <Modal
        show={showAddChildModal}
        onHide={() => {
          setShowAddChildModal(false);
          setChildForm({ firstname: '', middlename: '', lastname: '', date_of_birth: '', enrollment_date: '' });
          setChildErrors({});
        }}
        centered
        size={isMobile ? "sm" : "lg"}
        className={isMobile ? 'admin-mobile-modal' : ''}
      >
        <Modal.Header closeButton>
          <Modal.Title className={isMobile ? 'fs-6' : ''}>
            Add Child to {selectedUser?.first_name} {selectedUser?.last_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => { e.preventDefault(); handleAddChild(childForm); }}>
            <div style={{ maxWidth: isMobile ? '100%' : 760, margin: '0 auto', width: '100%' }}>
              <Row className="g-2">
              <Col xs={12} md={4}>
                <Form.Group>
                  <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="firstname"
                    value={childForm.firstname}
                    onChange={(e) => setChildForm(prev => ({ ...prev, firstname: e.target.value }))}
                    isInvalid={!!childErrors.firstname}
                    placeholder="First name"
                  />
                  <Form.Control.Feedback type="invalid">{childErrors.firstname}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={12} md={4}>
                <Form.Group>
                  <Form.Label>Middle Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="middlename"
                    value={childForm.middlename}
                    onChange={(e) => setChildForm(prev => ({ ...prev, middlename: e.target.value }))}
                    placeholder="Middle name (optional)"
                  />
                </Form.Group>
              </Col>

              <Col xs={12} md={4}>
                <Form.Group>
                  <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="lastname"
                    value={childForm.lastname}
                    onChange={(e) => setChildForm(prev => ({ ...prev, lastname: e.target.value }))}
                    isInvalid={!!childErrors.lastname}
                    placeholder="Last name"
                  />
                  <Form.Control.Feedback type="invalid">{childErrors.lastname}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Birth Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="date_of_birth"
                    value={childForm.date_of_birth}
                    onChange={(e) => setChildForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    isInvalid={!!childErrors.date_of_birth}
                    max={todayStr}
                  />
                  <Form.Control.Feedback type="invalid">{childErrors.date_of_birth}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Enrollment Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="enrollment_date"
                    value={childForm.enrollment_date}
                    onChange={(e) => setChildForm(prev => ({ ...prev, enrollment_date: e.target.value }))}
                    isInvalid={!!childErrors.enrollment_date}
                    min={childForm.date_of_birth || ''}
                    max={todayStr}
                  />
                  <Form.Control.Feedback type="invalid">{childErrors.enrollment_date}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              </Row>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                size="sm"
                onClick={() => { 
                  setShowAddChildModal(false); 
                  setChildForm({ firstname: '', middlename: '', lastname: '', date_of_birth: '', enrollment_date: '' });
                  setChildErrors({}); 
                }}
                style={{
                  minWidth: 100,
                  padding: '6px 12px',
                  height: 36,
                  borderRadius: 20,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.danger,
                  fontWeight: 600
                }}
              >
                Cancel
              </Button>

              <Button
                size="sm"
                type="submit"
                disabled={!isChildFormValid(childForm)}
                style={{
                  minWidth: 100,
                  padding: '6px 12px',
                  height: 36,
                  borderRadius: 20,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.primary,
                  fontWeight: 600
                }}
              >
                Add Child
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Edit Child Modal */}
      <Modal
        show={showEditChildModal}
        onHide={() => {
          setShowEditChildModal(false);
          setEditChildForm({ firstname: '', middlename: '', lastname: '', date_of_birth: '', enrollment_date: '' });
          setEditChildErrors({});
          setSelectedChild(null);
        }}
        centered
        size={isMobile ? "sm" : "lg"}
        className={isMobile ? 'admin-mobile-modal' : ''}
      >
        <Modal.Header closeButton>
          <Modal.Title className={isMobile ? 'fs-6' : ''}>
            Edit Child: {selectedChild?.first_name} {selectedChild?.last_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={(e) => { e.preventDefault(); handleUpdateChild(editChildForm); }}>
            <div style={{ maxWidth: isMobile ? '100%' : 760, margin: '0 auto', width: '100%' }}>
              <Row className="g-2">
              <Col xs={12} md={4}>
                <Form.Group>
                  <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="firstname"
                    value={editChildForm.firstname}
                    onChange={(e) => setEditChildForm(prev => ({ ...prev, firstname: e.target.value }))}
                    isInvalid={!!editChildErrors.firstname}
                    placeholder="First name"
                  />
                  <Form.Control.Feedback type="invalid">{editChildErrors.firstname}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={12} md={4}>
                <Form.Group>
                  <Form.Label>Middle Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="middlename"
                    value={editChildForm.middlename}
                    onChange={(e) => setEditChildForm(prev => ({ ...prev, middlename: e.target.value }))}
                    placeholder="Middle name (optional)"
                  />
                </Form.Group>
              </Col>

              <Col xs={12} md={4}>
                <Form.Group>
                  <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="lastname"
                    value={editChildForm.lastname}
                    onChange={(e) => setEditChildForm(prev => ({ ...prev, lastname: e.target.value }))}
                    isInvalid={!!editChildErrors.lastname}
                    placeholder="Last name"
                  />
                  <Form.Control.Feedback type="invalid">{editChildErrors.lastname}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Birth Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="date_of_birth"
                    value={editChildForm.date_of_birth}
                    onChange={(e) => setEditChildForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                    isInvalid={!!editChildErrors.date_of_birth}
                  />
                  <Form.Control.Feedback type="invalid">{editChildErrors.date_of_birth}</Form.Control.Feedback>
                </Form.Group>
              </Col>

              <Col xs={12} md={6}>
                <Form.Group>
                  <Form.Label>Enrollment Date</Form.Label>
                  <Form.Control
                    type="date"
                    name="enrollment_date"
                    value={editChildForm.enrollment_date}
                    onChange={(e) => setEditChildForm(prev => ({ ...prev, enrollment_date: e.target.value }))}
                    isInvalid={!!editChildErrors.enrollment_date}
                  />
                  <Form.Control.Feedback type="invalid">{editChildErrors.enrollment_date}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              </Row>
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              <Button
                size="sm"
                onClick={() => { 
                  setShowEditChildModal(false); 
                  setEditChildForm({ firstname: '', middlename: '', lastname: '', date_of_birth: '', enrollment_date: '' });
                  setEditChildErrors({});
                  setSelectedChild(null);
                }}
                style={{
                  minWidth: 100,
                  padding: '6px 12px',
                  height: 36,
                  borderRadius: 20,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.danger,
                  fontWeight: 600
                }}
              >
                Cancel
              </Button>

              <Button
                size="sm"
                type="submit"
                style={{
                  minWidth: 100,
                  padding: '6px 12px',
                  height: 36,
                  borderRadius: 20,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.primary,
                  fontWeight: 600
                }}
              >
                Update Child
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={handleCloseDeleteModal}
        centered
        size={isMobile ? "sm" : "md"}
        className={isMobile ? 'admin-mobile-modal' : ''}
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <FiAlertCircle size={48} color="#ea5455" className="mb-3" />
          <p>Are you sure you want to delete this {activeTab.slice(0, -1)}?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => confirmDelete()}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
      <style>{`
        /* Mobile responsive styles */
        @media (max-width: 768px) {
          /* Mobile main container scrolling */
          .mobile-admin-container {
            height: auto !important;
            min-height: calc(100vh - 76px) !important;
            overflow: visible !important;
          }
          
          .mobile-admin-card {
            height: auto !important;
            overflow: visible !important;
          }
          
          .mobile-admin-body {
            height: auto !important;
            overflow: visible !important;
          }
          
          .mobile-content-area {
            height: auto !important;
            overflow: visible !important;
          }
          
          /* Ensure mobile table wrapper is properly sized */
          .table-wrapper {
            max-height: 60vh !important;
            min-height: 400px !important;
            flex: none !important;
            margin-bottom: 1rem !important;
          }
          
          .admin-mobile-modal .modal-dialog {
            margin: 0.5rem;
            max-width: calc(100% - 1rem);
            /* Allow dialog to center vertically and constrain height */
            max-height: calc(100vh - 2rem);
            display: flex;
            align-items: center;
          }
          
          .admin-mobile-modal .modal-content {
            border-radius: 0.75rem;
            /* Let content size itself but constrain max height so it can center */
            height: auto;
            max-height: calc(100vh - 3rem);
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }
          
          .admin-mobile-modal .modal-body {
            padding: 0.75rem !important;
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            position: relative;
          }
          
          .admin-mobile-modal .modal-body::-webkit-scrollbar {
            width: 4px;
          }
          
          .admin-mobile-modal .modal-body::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 2px;
          }
          
          .admin-mobile-modal .modal-body::-webkit-scrollbar-thumb {
            background: #c1c1c1;
            border-radius: 2px;
          }
          
          .admin-mobile-modal .modal-header {
            padding: 0.75rem 1rem;
            border-radius: 0.75rem 0.75rem 0 0;
            flex-shrink: 0;
          }
          
          .admin-mobile-modal .modal-title {
            font-size: 1rem !important;
          }
          
          /* Mobile table styles */
          .table-responsive {
            border: none !important;
            font-size: 0.75rem !important;
            overflow-x: auto !important;
          }
          
          .table-responsive table {
            min-width: 700px !important;
          }
          
          .custom-table {
            border-collapse: separate !important;
            border-spacing: 0 !important;
          }
          
          .custom-table thead th {
            padding: 8px 4px !important;
            font-size: 0.7rem !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
            background: #f8f9fa !important;
            border-bottom: 2px solid #dee2e6 !important;
          }
          
          .custom-table tbody td {
            padding: 8px 4px !important;
            font-size: 0.75rem !important;
            vertical-align: middle !important;
            border-top: 1px solid #dee2e6 !important;
          }
          
          .custom-table tbody tr:hover {
            background-color: rgba(0, 123, 255, 0.05) !important;
          }
          
          /* Better mobile table wrapper */
          .table-wrapper {
            -webkit-overflow-scrolling: touch !important;
            border: 1px solid #dee2e6 !important;
          }
          
          /* Mobile scrollbar styling */
          .table-wrapper::-webkit-scrollbar {
            width: 8px !important;
            height: 8px !important;
          }
          
          .table-wrapper::-webkit-scrollbar-track {
            background: #f1f1f1 !important;
            border-radius: 4px !important;
          }
          
          .table-wrapper::-webkit-scrollbar-thumb {
            background: #c1c1c1 !important;
            border-radius: 4px !important;
          }
          
          .table-wrapper::-webkit-scrollbar-thumb:hover {
            background: #a8a8a8 !important;
          }
          
          /* Mobile form styles */
          .admin-mobile-modal .form-section {
            margin-bottom: 1rem !important;
          }
          
          .admin-mobile-modal .section-header {
            padding: 0.75rem 1rem;
          }
          
          .admin-mobile-modal .section-content {
            padding: 1rem !important;
          }
          
          .admin-mobile-modal .form-control-modern {
            height: 38px !important;
            font-size: 0.85rem !important;
          }
          
          .admin-mobile-modal .form-label {
            font-size: 0.8rem !important;
            margin-bottom: 0.25rem !important;
          }
          
          .admin-mobile-modal .btn-action {
            font-size: 0.8rem !important;
            padding: 0.5rem 1rem !important;
            height: auto !important;
            min-height: 40px !important;
          }
          
          /* Mobile pagination */
          .pagination {
            font-size: 0.8rem !important;
          }
          
          .pagination .page-item .page-link {
            padding: 0.375rem 0.5rem !important;
          }
          
          /* Mobile details container */
          .details-container {
            margin: 0.25rem 0.5rem !important;
          }
          
          .details-card {
            padding: 1rem !important;
          }
          
          .info-grid {
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          
          .user-avatar {
            width: 32px !important;
            height: 32px !important;
          }
        }
        
        .bg-primary-light {
          background-color: rgba(0, 102, 254, 0.1);
        }
        .bg-success-light {
          background-color: rgba(40, 199, 111, 0.1);
        }
        .bg-info-light {
          background-color: rgba(0, 207, 232, 0.1);
        }

        /* Fix for tab buttons text color */
        :global(.nav-tabs .nav-link) {
          color: #212529 !important;
          font-weight: 500;
          border-color: transparent;
          background-color: transparent;
          opacity: 1;
          padding: 0.5rem 0.75rem;
          font-size: 0.9rem;
          transition: all 0.2s ease-in-out;
          position: relative;
          margin-right: 1rem;
          margin-top: 1rem;
        }
        
        :global(.nav-tabs) {
          border-bottom: 1px solid #dee2e6;
          padding-bottom: 0;
          margin-top: auto;
        }

        :global(.nav-tabs .nav-item) {
          margin-bottom: -1px;
        }

        :global(.nav-tabs .nav-link:hover) {
          color: #0d6efd !important;
          background-color: rgba(13, 110, 253, 0.05);
          border-color: transparent;
          transform: translateY(-1px);
        }
        
        :global(.nav-tabs .nav-link.active) {
          color: #0d6efd !important;
          font-weight: 600;
          border-bottom: 2px solid #0d6efd;
          background-color: rgba(13, 110, 253, 0.05);
        }
        
        :global(.nav-tabs .nav-link.active::after) {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #0d6efd;
          transition: transform 0.3s ease;
        }

        :global(.nav-tabs) {
          border-bottom: 1px solid #dee2e6;
        }

        :global(.nav-tabs .nav-item) {
          margin-bottom: -1px;
        }

        :global(.tab-content) {
          padding-top: 1rem;
        }

        :global(.custom-table) {
          position: relative;
          border-collapse: separate;
          border-spacing: 0 8px;
          margin-top: -8px;
          width: 100%;
        }

        :global(.custom-table thead) {
          position: sticky;
          top: 0;
          z-index: 3;
          background: #f8f9fa;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        :global(.details-row) {
          position: relative;
          z-index: 2;
        }

        :global(.table-wrapper) {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          background-color: white;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
          margin-bottom: 1rem;
          position: relative;
          height: 100%;
        }

        :global(.table-wrapper::-webkit-scrollbar) {
          width: 8px;
        }
        
        :global(.table-wrapper::-webkit-scrollbar-track) {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        :global(.table-wrapper::-webkit-scrollbar-thumb) {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        :global(.table-wrapper::-webkit-scrollbar-thumb:hover) {
          background: #a8a8a8;
        }

        :global(.custom-table thead th) {
          border: none;
          padding: 12px 16px;
          font-weight: 600;
          color: #212529;
          background: #f8f9fa;
          white-space: nowrap;
        }

        :global(.custom-table tbody) {
          position: relative;
        }

        :global(.custom-table tbody tr) {
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
          transition: all 0.2s ease;
          background: white;
        }

        :global(.custom-table tbody tr:hover) {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.08);
          z-index: 1;
          position: relative;
        }

        :global(.custom-table tbody td) {
          border: none;
          padding: 16px;
          vertical-align: middle;
          color: #212529;
          font-weight: 400;
          background: white;
        }

        :global(.btn) {
          opacity: 1 !important;
          color: inherit !important;
        }

        :global(.btn-primary) {
          background-color: #0d6efd !important;
          color: white !important;
          border-color: #0d6efd;
        }

        :global(.btn-secondary) {
          background-color: #6c757d !important;
          color: white !important;
          border-color: #6c757d;
        }

        :global(.btn-danger) {
          background-color: #dc3545 !important;
          color: white !important;
          border-color: #dc3545;
        }
          :global(.btn-light) {
          background-color: #f8f9fa !important;
          color: #212529 !important;
          border: 1px solid #000 !important;
        }
        
        :global(.btn) {
          border: 1px solid #000 !important;
        }

        :global(.btn-outline-primary) {
          background-color: transparent !important;
          border: 1px solid #0d6efd;
          color: #0d6efd !important;
          transition: all 0.2s ease;
          min-width: 32px;
          height: 32px;
          padding: 0 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        :global(.btn-outline-primary:hover) {
          background-color: rgba(13, 110, 253, 0.1) !important;
          transform: translateY(-1px);
        }

        :global(.btn-outline-danger) {
          background-color: transparent !important;
          border: 1px solid #dc3545;
          color: #dc3545 !important;
          transition: all 0.2s ease;
          min-width: 32px;
          height: 32px;
          padding: 0 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
        }

        :global(.btn-outline-danger:hover) {
          background-color: rgba(220, 53, 69, 0.1) !important;
          transform: translateY(-1px);
        }        :global(.details-row td) {
          padding: 0 !important;
          background: transparent !important;
          transition: all 0.3s ease;
        }

        :global(.details-container) {
          margin: 0.5rem 1rem !important;
          background-color: #f8f9fa;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        :global(.details-card) {
          background-color: white;
          border-radius: 8px;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.05);
        }

        :global(.section-title) {
          color: #0d6efd;
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          text-align: center;
          position: relative;
        }

        :global(.section-title::after) {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 3px;
          background: #0d6efd;
          border-radius: 2px;
        }

        :global(.info-section) {
          background: rgba(13, 110, 253, 0.02);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(13, 110, 253, 0.08);
        }

        :global(.info-grid) {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        :global(.info-item) {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        :global(.info-label) {
          font-size: 0.85rem;
          color: #6c757d;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        :global(.info-value) {
          font-size: 1rem;
          color: #212529;
          font-weight: 500;
        }

        /* Better visibility for text in all tables */
        :global(.custom-table .d-flex div),
        :global(.custom-table td) {
          color: #212529;
        }
        
        /* Fix for pagination buttons */
        :global(.pagination .page-link) {
          color: #212529 !important;
          opacity: 1;
        }
        
        :global(.pagination .active .page-link) {
          background-color: #0d6efd !important;
          border-color: #0d6efd !important;
          color: white !important;
        }

        /* Updated styles for user details */
        .details-container {
          background: linear-gradient(to right, rgba(248,249,250,0.5), rgba(255,255,255,0.5));
          border-radius: 8px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
        }

        .details-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          border: 1px solid rgba(0,0,0,0.05);
        }

        .user-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(13, 110, 253, 0.1);
          color: #0d6efd;
        }

        .info-section {
          background: rgba(13, 110, 253, 0.02);
          border-radius: 8px;
          border: 1px solid rgba(13, 110, 253, 0.08);
        }

        .info-grid {
          display: grid;
          gap: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }

        .info-item:last-child {
          border-bottom: none;
        }

        .info-label {
          font-size: 0.75rem;
          color: #6c757d;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 0.25rem;
        }

        .info-value {
          font-size: 0.9rem;
          color: #212529;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

// UserForm component with proper fields for each user type
// Separate form for adding children
const AddChildForm = ({ data, onSubmit, onCancel, isMobile }) => {
  const initialFormData = {
    firstname: '',
    middlename: '',
    lastname: '',
    birthdate: '',
    enrollment_date: '',
    student_id: '',
    emailaddress: '',
    contactnumber: '',
    password: '',
    profile_picture_url: '',
    section_id: '',
    is_active: true,
    parent_id: data?.id || '', // Keep only parent ID from selected parent
    ...(data ? Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, value === null ? '' : value])
    ) : {})
  };

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  React.useEffect(() => {
    setFormData(initialFormData);
    setErrors({});
  }, [data]);

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['firstname', 'lastname', 'date_of_birth'];

    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = `${field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      // Keep middlename in submission so it can be persisted to students
      onSubmit(formData);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '0' : '0' }}>
        <Form onSubmit={handleSubmit} className="modern-form">
          {/* Student Information Section */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">
                <FiUser size={20} />
              </div>
              <h6>Student Information</h6>
            </div>
            <div className="section-content">
              <Row className="g-2">
                <Col xs={12} md={4}>
                  <Form.Group className="form-group">
                    <Form.Label>
                      First Name <span className="required">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleInputChange}
                      isInvalid={!!errors.firstname}
                      className="form-control-modern"
                      placeholder="Enter first name"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.firstname}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Group className="form-group">
                    <Form.Label>Middle Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="middlename"
                      value={formData.middlename !== undefined ? formData.middlename : ""}
                      onChange={handleInputChange}
                      className="form-control-modern"
                      placeholder="Enter middle name (optional)"
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Group className="form-group">
                    <Form.Label>
                      Last Name <span className="required">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleInputChange}
                      isInvalid={!!errors.lastname}
                      className="form-control-modern"
                      placeholder="Enter last name"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.lastname}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="g-3 mt-2">
                <Col xs={12} md={4}>
                  <Form.Group className="form-group">
                    <Form.Label>Birth Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="form-control-modern"
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Group className="form-group">
                    <Form.Label>Enrollment Date</Form.Label>
                    <Form.Control
                      type="date"
                      name="enrollment_date"
                      value={formData.enrollment_date}
                      onChange={handleInputChange}
                      className="form-control-modern"
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Group className="form-group">
                    <Form.Label>Student ID</Form.Label>
                    <Form.Control
                      type="text"
                      name="student_id"
                      value={formData.student_id || "(auto-generated)"}
                      readOnly
                      className="form-control-modern bg-light"
                    />
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </div>

          {/* Hidden parent_id field */}
          <Form.Control 
            type="hidden" 
            name="parent_id" 
            value={data?.id || ''} 
          />

          <div className="form-actions">
            <div className={`d-flex ${isMobile ? 'flex-column gap-2' : 'justify-content-end align-items-center gap-3'}`}>
              <Button
                variant="outline-danger"
                onClick={onCancel}
                className={`btn-action btn-cancel ${isMobile ? 'w-100' : ''}`}
                size="sm"
                style={{
                  minHeight: isMobile ? '44px' : 'auto',
                  fontSize: isMobile ? '0.9rem' : 'inherit'
                }}
              >
                <FiX size={14} className="me-1" /> Cancel
              </Button>
              <Button
                variant="outline-primary"
                type="submit"
                className={`btn-action btn-submit ${isMobile ? 'w-100' : ''}`}
                size="sm"
                style={{
                  minHeight: isMobile ? '44px' : 'auto',
                  fontSize: isMobile ? '0.9rem' : 'inherit'
                }}
              >
                <FiPlus size={14} className="me-1" /> Add Child to Selected Parent
              </Button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
};

const UserForm = ({ type, data, onSubmit, onCancel, isMobile, modalAction }) => {
  // First create base form structure
  const baseFormData = {
    firstname: '',
    middlename: '',
    lastname: '',
    birthdate: '',
    enrollment_date: '',
    student_id: '',
    contactnumber: '',
    password: '',
    parentfirstname: '',
    parentmiddlename: '',
    parentlastname: '',
    profile_picture_url: '',
    section_id: '',
    is_active: true,
    emailaddress: ''
  };
  
  // Merge incoming data and normalize common DB keys to form field names
  const normalizedData = (() => {
    if (!data) return {};
    const normalized = {};
    const keyMap = {
      first_name: 'firstname',
      middle_name: 'middlename',
      last_name: 'lastname',
      date_of_birth: 'birthdate',
      enrollment_date: 'enrollment_date',
      student_id: 'student_id',
      contact_number: 'contactnumber',
      contact: 'contactnumber',
      contactnumber: 'contactnumber',
      phone_number: 'contactnumber',
      username: 'emailaddress',
      emailaddress: 'emailaddress',
      email: 'emailaddress',
      parent_id: 'parent_id',
      parentfirstname: 'parentfirstname',
      parentlastname: 'parentlastname',
      parentmiddlename: 'parentmiddlename',
      parent_first_name: 'parentfirstname',
      parent_last_name: 'parentlastname',
      parent_email: 'emailaddress',
      parent_contact: 'contactnumber'
    };
    Object.entries(data).forEach(([k, v]) => {
      const mappedKey = keyMap[k] || k;
      // convert null -> empty string
      normalized[mappedKey] = v === null || v === undefined ? '' : v;
    });
    
    // Handle nested parent data (when editing student)
    if (data.parent) {
      if (data.parent.first_name) normalized.parentfirstname = data.parent.first_name;
      if (data.parent.last_name) normalized.parentlastname = data.parent.last_name;
      if (data.parent.middle_name) normalized.parentmiddlename = data.parent.middle_name;
      if (data.parent.username) normalized.emailaddress = data.parent.username;
      if (data.parent.email) normalized.emailaddress = data.parent.email;
      if (data.parent.contact) normalized.contactnumber = data.parent.contact;
    }
    
    // Handle direct parent editing - map their own names to parent fields
    if (data.role === 'parent') {
      if (data.first_name || normalized.firstname) normalized.parentfirstname = data.first_name || normalized.firstname;
      if (data.last_name || normalized.lastname) normalized.parentlastname = data.last_name || normalized.lastname;
      if (data.middle_name || normalized.middlename) normalized.parentmiddlename = data.middle_name || normalized.middlename;
      // Don't override email if it's already set from username mapping above
      if (!normalized.emailaddress && (data.username || data.email)) {
        normalized.emailaddress = data.username || data.email;
      }
    }
    return normalized;
  })();

  const initialFormData = { ...baseFormData, ...normalizedData };
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  React.useEffect(() => {
    setFormData(initialFormData);
    setErrors({});
  }, [data, type]);

  const isCreating = !data || !data.id;

  const isFormValid = () => {
    // When editing (not creating), allow submit (Update) without forcing create-only fields
    if (!isCreating) return true;

    // For creation, perform required checks
    const cloned = { ...formData };
    if (!cloned.firstname?.toString().trim()) return false;
    if (!cloned.lastname?.toString().trim()) return false;
    if (type === 'students') {
      if (!cloned.birthdate) return false;
      if (!cloned.enrollment_date) return false;
      if (!cloned.parentfirstname?.toString().trim()) return false;
      if (!cloned.parentlastname?.toString().trim()) return false;
      // Remove date validation constraints that were preventing form submission
      // const today = new Date().toISOString().split('T')[0];
      // if (cloned.birthdate > today) return false;
      // if (new Date(cloned.enrollment_date) < new Date(cloned.birthdate)) return false;
      // if (cloned.enrollment_date > today) return false;
    }
    if (isCreating) {
      if (!cloned.emailaddress?.toString().trim()) return false;
      if (!cloned.password?.toString()) return false;
      // Contact number is optional since it's not stored in user_profiles table
    }
    return true;
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // If editing (not creating), only perform lightweight validations:
    // - password length if provided
    // - phone format if provided
    if (!isCreating) {
      if (formData.password && formData.password.trim() && formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      if (formData.contactnumber) {
        const phoneRegex = /^0\d{10}$/;
        if (!phoneRegex.test(formData.contactnumber)) {
          newErrors.contactnumber = 'Enter a valid 11-digit phone number starting with 0';
        }
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }

    // Creation path: full validation (existing behavior)
    let requiredFields = ['firstname', 'lastname'];
    if (type === 'students') {
      requiredFields.push('birthdate', 'enrollment_date');
    }
    requiredFields.push('emailaddress', 'password');
    // Contact number is optional since it's not stored in user_profiles table
    if (type === 'students') {
      requiredFields.push('parentfirstname', 'parentlastname');
    }

    requiredFields.forEach(field => {
      if (!formData[field]?.toString().trim()) {
        newErrors[field] = field.includes('parent') ?
          `Parent's ${field.replace('parent', '').toLowerCase()} is required` :
          `${field === 'birthdate' ? 'Birth date' : field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
      }
    });

    if (type !== 'students' && formData.emailaddress && !/\S+@\S+\.\S+/.test(formData.emailaddress)) {
      newErrors.emailaddress = 'Invalid email address';
    }

    // Date checks for students - normalize comparisons to dates (no time) so selecting today's date is allowed
    if (type === 'students') {
      const todayDate = new Date();
      todayDate.setHours(0,0,0,0);

      if (formData.birthdate) {
        const dob = new Date(formData.birthdate);
        dob.setHours(0,0,0,0);
        if (isNaN(dob.getTime())) newErrors.birthdate = 'Invalid birth date';
        else if (dob.getTime() > todayDate.getTime()) newErrors.birthdate = 'Birth date cannot be in the future';
      }

      if (formData.enrollment_date) {
        const enroll = new Date(formData.enrollment_date);
        enroll.setHours(0,0,0,0);
        if (isNaN(enroll.getTime())) newErrors.enrollment_date = 'Invalid enrollment date';
        else if (formData.birthdate) {
          const dob = new Date(formData.birthdate);
          dob.setHours(0,0,0,0);
          if (enroll.getTime() < dob.getTime()) newErrors.enrollment_date = 'Enrollment date cannot be before birth date';
        }
        // Allow enrollment date equal to today (not strictly greater)
        else if (enroll.getTime() > todayDate.getTime()) newErrors.enrollment_date = 'Enrollment date cannot be in the future';
      }
    }

    if (formData.password) {
      if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
  // Keep middlename in the submission so student middle names are persisted
  const submissionData = { ...formData };
      
      // For parent editing, map parent fields back to user fields
      if (data?.role === 'parent' && !isCreating) {
        submissionData.firstname = submissionData.parentfirstname;
        submissionData.lastname = submissionData.parentlastname;
        // Map parent middle name and contact number into top-level fields
        if (submissionData.parentmiddlename !== undefined) {
          // set both `middlename` (form-style) and `middle_name` (db-style) so
          // downstream handlers/readers accept either key
          submissionData.middlename = submissionData.parentmiddlename || '';
          submissionData.middle_name = submissionData.middlename || null;
        }
        if (submissionData.contactnumber !== undefined) {
          submissionData.contact = submissionData.contactnumber || null;
        }
        if (submissionData.parentemailaddress !== undefined) {
          submissionData.emailaddress = submissionData.parentemailaddress || submissionData.emailaddress || null;
        }
        // Remove parent-only fields as they're not part of the user_profiles table
        delete submissionData.parentfirstname;
        delete submissionData.parentlastname;
        delete submissionData.parentmiddlename;
        delete submissionData.parentemailaddress;
      }
        // Before submitting creation, ensure the email isn't already in use (prevent duplicate)
        if (modalAction.type === 'create') {
          const emailVal = (submissionData.emailaddress || '').toString().trim().toLowerCase();
          if (emailVal) {
            try {
              const username = emailVal.split('@')[0];
              // URL-encode values inserted into the or() filter to avoid syntax errors
              const encodedUsername = encodeURIComponent(username);
              const encodedEmail = encodeURIComponent(emailVal);
              const { data: existing, error: lookupErr } = await supabaseAdmin
                .from('user_profiles')
                .select('id')
                // Check both username and email columns. Do not reference non-existent columns like `emailaddress`.
                .or(`username.eq.${encodedUsername},email.eq.${encodedEmail}`)
                .maybeSingle();
              if (lookupErr) console.warn('Email lookup warning:', lookupErr);
              if (existing && existing.id) {
                // Set inline field error so the Form.Control.Feedback shows below the input
                setErrors(prev => ({ ...prev, emailaddress: 'This email is already in use' }));
                return; // abort submission
              }
            } catch (e) {
              // allow submission to proceed in case of transient error
            }
          }
        }

        onSubmit(submissionData);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contactnumber') {
      // Only allow digits and format properly
      const numericValue = value.replace(/\D/g, '');
      const formattedValue = numericValue.startsWith('0')
        ? numericValue
        : numericValue ? '0' + numericValue : '';
      setFormData({
        ...formData,
        [name]: formattedValue.slice(0, 11)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ padding: isMobile ? '0' : '20px' }}>
        <Form onSubmit={handleSubmit} className="modern-form">
          <div style={{ maxWidth: isMobile ? '100%' : 760, margin: '0 auto', width: '100%' }}>
            {/* User Information Section - Hide when editing parents */}
            {!(data?.role === 'parent' && !isCreating) && (
              <div className="form-section">
                <div className="section-header">
                  <div className="section-icon">
                    <FiUser size={20} />
                  </div>
                  <h6>{type === 'students' ? 'Student' : type === 'teachers' ? 'Teacher' : data?.role === 'parent' ? 'Parent' : 'Admin'} Information</h6>
                </div>
            <div className="section-content">
              <Row className="g-1">
                <Col xs={12} md={4}>
                  <Form.Group className="form-group">
                    <Form.Label>
                      {type === 'students' ? "Student's First Name" : "First Name"} <span className="required">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="firstname"
                      value={formData.firstname !== undefined ? formData.firstname : ""}
                      onChange={handleInputChange}
                      isInvalid={!!errors.firstname}
                      className="form-control-modern"
                      placeholder={type === 'students' ? "Enter student's first name" : "First name"}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.firstname}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Group className="form-group">
                    <Form.Label>{type === 'students' ? "Student's Middle Name" : "Middle Name"}</Form.Label>
                    <Form.Control
                      type="text"
                      name="middlename"
                      value={formData.middlename !== undefined ? formData.middlename : ""}
                      onChange={handleInputChange}
                      className="form-control-modern"
                      placeholder={type === 'students' ? "Enter student's middle name (optional)" : "Middle name (optional)"}
                    />
                  </Form.Group>
                </Col>
                <Col xs={12} md={4}>
                  <Form.Group className="form-group">
                    <Form.Label>
                      {type === 'students' ? "Student's Last Name" : "Last Name"} <span className="required">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="lastname"
                      value={formData.lastname !== undefined ? formData.lastname : ""}
                      onChange={handleInputChange}
                      isInvalid={!!errors.lastname}
                      className="form-control-modern"
                      placeholder={type === 'students' ? "Enter student's last name" : "Last name"}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.lastname}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-1">
                {type === 'students' && (
                  <>
                    <Col xs={12} md={4}>
                      <Form.Group className="form-group">
                        <Form.Label>Birth Date <span className="required">*</span></Form.Label>
                        <Form.Control
                          type="date"
                          name="birthdate"
                          value={formData.birthdate || ''}
                          onChange={handleInputChange}
                          className="form-control-modern"
                          isInvalid={!!errors.birthdate}
                        />
                        <Form.Control.Feedback type="invalid">{errors.birthdate}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4}>
                      <Form.Group className="form-group">
                        <Form.Label>Enrollment Date <span className="required">*</span></Form.Label>
                        <Form.Control
                          type="date"
                          name="enrollment_date"
                          value={formData.enrollment_date || ''}
                          onChange={handleInputChange}
                          className="form-control-modern"
                          isInvalid={!!errors.enrollment_date}
                        />
                        <Form.Control.Feedback type="invalid">{errors.enrollment_date}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </>
                )}
                <Col xs={12} md={4}>
                  <Form.Group className="form-group">
                    <Form.Label>
                      {type === 'students' ? 'Student ID' : type === 'teachers' ? 'Teacher ID' : 'Admin ID'}
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name={type === 'students' ? 'student_id' : type === 'teachers' ? 'teacher_id' : 'admin_id'}
                      value={type === 'students'
                        ? (formData.student_id !== undefined ? formData.student_id : "(auto-generated)")
                        : type === 'teachers'
                          ? (formData.teacher_id !== undefined ? formData.teacher_id : "(auto-generated)")
                          : (formData.admin_id !== undefined ? formData.admin_id : "(auto-generated)")}
                      readOnly
                      disabled
                      tabIndex="-1"
                      style={{ userSelect: 'none', cursor: 'not-allowed' }}
                      className="form-control-modern bg-light"
                    />
                  </Form.Group>
                </Col>
              </Row>
              </div>
            </div>
            )}


          {/* Parent Information for Students */}
          {type === 'students' && (
            <div className="form-section">
              <div className="section-header">
                <div className="section-icon">
                  <FiUsers size={20} />
                </div>
                <h6>Parent Information</h6>
              </div>
              <div className="section-content">
                <Row className="g-1">
                  <Col xs={12} md={4}>
                    <Form.Group className="form-group">
                      <Form.Label>
                        Parent's First Name <span className="required">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="parentfirstname"
                        value={formData.parentfirstname !== undefined ? formData.parentfirstname : ""}
                        onChange={handleInputChange}
                        isInvalid={!!errors.parentfirstname}
                        className="form-control-modern"
                        placeholder="Enter parent's first name"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.parentfirstname}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={4}>
                    <Form.Group className="form-group">
                      <Form.Label>Parent's Middle Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="parentmiddlename"
                        value={formData.parentmiddlename !== undefined ? formData.parentmiddlename : ""}
                        onChange={handleInputChange}
                        className="form-control-modern"
                        placeholder="Enter parent's middle name (optional)"
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={4}>
                    <Form.Group className="form-group">
                      <Form.Label>
                        Parent's Last Name <span className="required">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="parentlastname"
                        value={formData.parentlastname !== undefined ? formData.parentlastname : ""}
                        onChange={handleInputChange}
                        isInvalid={!!errors.parentlastname}
                        className="form-control-modern"
                        placeholder="Enter parent's last name"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.parentlastname}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">
                <FiSearch size={20} />
              </div>
              <h6>Contact Information</h6>
            </div>        <div className="section-content">
              <Row className="g-1 align-items-start">
                {/* Email Address Field */}
                <Col xs={12} md={6}>
                  <Form.Group className="form-group">
                    <Form.Label>
                      Email Address <span className="required">*</span>
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="emailaddress"
                      value={formData.emailaddress !== undefined ? formData.emailaddress : ""}
                      onChange={handleInputChange}
                      readOnly={!isCreating}
                      disabled={!isCreating}
                      isInvalid={!!errors.emailaddress}
                      className="form-control-modern"
                      placeholder="Enter email address"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.emailaddress}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                {/* Contact Number Field */}
                <Col xs={12} md={6}>
                  <Form.Group className="form-group">
                    <Form.Label>
                      Contact Number <span className="required">*</span>
                    </Form.Label>
                    <Form.Control
                      type="tel"
                      name="contactnumber"
                      value={formData.contactnumber !== undefined ? formData.contactnumber : ""}
                      onChange={handleInputChange}
                      /* allow editing contact number for both create and edit */
                      isInvalid={!!errors.contactnumber}
                      placeholder="0XXX XXX XXXX"
                      maxLength={11}
                      className="form-control-modern"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.contactnumber}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted small-hint">
                      Enter 11-digit number starting with 0
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </div>

          {/* Password Field */}
          <div className="form-section">
            <div className="section-header">
              <div className="section-icon">
                <FiAlertCircle size={20} />
              </div>
              <h6>Security</h6>
            </div>
            <div className="section-content">
              <Row className="g-1">
                <Col xs={12} md={6}>
                  <Form.Group className="form-group">
                    <Form.Label>
                      {isCreating ? 'Set a password for the account' : 'Change Password (leave empty to keep current)'}
                      {isCreating && <span className="required">*</span>}
                    </Form.Label>
                    <div style={{ position: 'relative' }}>
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password || ''}
                        onChange={handleInputChange}
                        isInvalid={!!errors.password}
                        placeholder={isCreating ? "Enter password" : "Enter new password (optional)"}
                        className="form-control-modern"
                      />
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          cursor: 'pointer',
                          color: '#007bff',
                          zIndex: 5
                        }}
                      >
                        {showPassword ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                      </span>
                    </div>
                    <Form.Control.Feedback type="invalid">
                      {errors.password}
                    </Form.Control.Feedback>
                    <Form.Text className="text-muted small-hint">
                      Password must be at least 8 characters
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </div>
          </div>
          <div className="form-actions">
            <div className={`d-flex ${isMobile ? 'flex-column gap-2' : 'justify-content-end align-items-center gap-3'}`}>
              <Button
                onClick={onCancel}
                className={`btn-action btn-cancel ${isMobile ? 'w-100' : ''}`}
                size="sm"
                style={{
                  minHeight: isMobile ? '44px' : 36,
                  minWidth: isMobile ? '100%' : 100,
                  padding: '6px 12px',
                  borderRadius: 20,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.danger,
                  fontWeight: 600
                }}
              >
                <FiX size={14} className="me-1" /> Cancel
              </Button>
              <Button
                type="submit"
                disabled={!isFormValid()}
                onClick={() => console.log('Submit button clicked, isFormValid:', isFormValid())}
                className={`btn-action btn-submit ${isMobile ? 'w-100' : ''}`}
                size="sm"
                style={{
                  minHeight: isMobile ? '44px' : 36,
                  minWidth: isMobile ? '100%' : 100,
                  padding: '6px 12px',
                  borderRadius: 20,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: colors.primary,
                  fontWeight: 600
                }}
              >
                {isCreating ? (
                  <>
                    <FiPlus size={14} className="me-1" /> Create
                  </>
                ) : (
                  <>
                    <FiEdit2 size={14} className="me-1" /> Update
                  </>
                )}
              </Button>
            </div>
          </div>
          </div>
          <style>{`
        :global(.modern-form) {
          padding: 0;
          width: 100%;
          max-width: 100%;
        }
        :global(.form-section) {
          margin-bottom: 0.45rem;
          border-radius: 8px;
          background-color: white;
          overflow: visible;
          box-shadow: 0 1px 4px rgba(0,0,0,0.03);
          border: 1px solid #f1f5f9;
          transition: all 0.12s ease;
        }
        
        :global(.form-section:hover) {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        
        :global(.section-header) {
          display: flex;
          align-items: center;
          padding: 0.28rem 0.6rem;
          background-color: #f8f9fa;
          border-bottom: 1px solid #f1f5f9;
        }
        
        :global(.section-icon) {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          margin-right: 12px;
          background-color: rgba(13, 110, 253, 0.1);
          color: #0d6efd;
        }
        
        :global(.section-header h6) {
          margin: 0;
          font-weight: 600;
          color: #495057;
          font-size: 1rem;
        }
        
        :global(.section-content) {
          padding: 0.2rem 0.4rem;
          background-color: white;
        }
        
        :global(.form-group) {
          margin-bottom: 0.15rem;
        }
        
        :global(.form-control-modern) {
          height: 28px;
          border-radius: 6px;
          border: 1px solid #e6edf3;
          padding: 0.15rem 0.4rem;
          font-size: 0.82rem;
          transition: all 0.12s ease;
          background-color: #fbfdff;
        }
        
        :global(.form-control-modern:focus) {
          border-color: #0d6efd;
          background-color: #fff;
          box-shadow: 0 0 0 3px rgba(13, 110, 253, 0.15);
        }
        
        :global(.form-control-modern:hover:not(:focus)) {
          border-color: #cbd5e1;
        }
        
        :global(.form-control-modern::placeholder) {
          color: #94a3b8;
        }
        
        :global(.form-label) {
          font-size: 0.78rem;
          font-weight: 500;
          color: #4b5563;
          margin-bottom: 0.2rem;
        }
        
        :global(.required) {
          color: #dc3545;
          font-weight: 700;
          margin-left: 2px;
        }
        
        :global(.small-hint) {
          font-size: 0.7rem;
          color: #6c757d;
          margin-top: 0.1rem;
        }
        :global(.form-actions) {
          margin-top: 0.3rem;
          padding-top: 0.3rem;
          border-top: 1px solid #f1f5f9;
        }

        :global(.btn-action) {
          font-weight: 500;
          border-radius: 10px;
          transition: all 0.18s ease;
          text-align: center;
          font-size: 13px;
          line-height: 1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          min-width: 32px;
          height: 32px;
          padding: 0 10px;
        }

        :global(.btn-cancel) {
          border: 1px solid #dc3545;
          background-color: transparent;
          color: #dc3545 !important;
        }

        :global(.btn-cancel:hover) {
          background-color: rgba(220, 53, 69, 0.1) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(220, 53, 69, 0.1);
        }

        :global(.btn-submit) {
          border: 1px solid #0d6efd;
          background-color: transparent;
          color: #0d6efd !important;
        }
        
        :global(.btn-submit:hover) {
          background-color: rgba(13, 110, 253, 0.1) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(13, 110, 253, 0.1);
        }
        
        :global(.btn-submit:hover) {
          background-color: #0b5ed7;
          border-color: #0a58ca;
        }
      `}</style>
        </Form>
      </div>
    </div>
  );
};

export default AdminPage;
