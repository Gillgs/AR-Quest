// filepath: c:\xampp\htdocs\augmentedapp\src\pages\ProfilePage.jsx
import React, { useState, useEffect, useRef, useContext } from "react";
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Button, 
  Form, 
  Modal,
  Spinner,
  Toast,
  InputGroup
} from "react-bootstrap";
import { supabase, supabaseAdmin, createSignedUrl, secureDeleteFile } from "../config/supabase";
import { FiUser, FiMail, FiEdit2, FiInfo, FiPhone, FiMapPin, FiCheckCircle, FiXCircle, FiX, FiSave, FiEye, FiEyeOff } from "react-icons/fi";
import { FaCamera } from "react-icons/fa";
import { colors } from "../styles/constants";
import SideMenu from "../components/SideMenu";
import { useLocation, useNavigate } from 'react-router-dom';
import { SelectedChildContext } from '../contexts/SelectedChildContext';

const mainContentStyle = {
  marginLeft: "220px",
  width: "calc(100% - 236px)",
  height: "100vh",
  padding: "2rem",
  position: "fixed",
  top: "0",
  right: "16px",
  overflowY: "auto",
  overflowX: "hidden",
  transition: "all 0.3s ease",
  backgroundColor: "#f9f9fa",
};

// Mobile-responsive main content style
const mobileMainContentStyle = {
  marginLeft: "0",
  width: "100%",
  height: "100vh",
  padding: "1rem",
  position: "fixed",
  top: "0",
  right: "0",
  overflowY: "auto",
  overflowX: "hidden",
  transition: "all 0.3s ease",
  backgroundColor: "#f9f9fa",
};

// Modern card style matching the new design
const CARD_STYLES = {
  borderRadius: "25px",
  boxShadow: "0 8px 30px rgba(255, 182, 193, 0.4)",
  border: "4px solid #FFB6C1",
  marginBottom: "30px",
  overflow: "hidden",
  background: "linear-gradient(135deg, #FFF0F5 0%, #E6F3FF 50%, #F0FFF0 100%)"
};

const infoGridStyles = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "1.25rem",
  width: "100%"
};

// Vibrant gradient button with hover effect
const BUTTON_STYLES = {
  background: "linear-gradient(135deg, #38BDF8 0%, #818CF8 50%, #C084FC 100%)",
  color: "#fff",
  border: "3px solid #38BDF8",
  boxShadow: "0 6px 0 #0EA5E9",
  fontWeight: "700",
  padding: "15px 35px",
  borderRadius: "25px",
  letterSpacing: "1px",
  transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
  transform: "translateY(0)",
  fontFamily: "'Comic Sans MS', cursive",
  fontSize: "1.1rem",
  "&:hover": {
    transform: "translateY(2px)",
    boxShadow: "0 4px 0 #FF1493",
  },
  "&:active": {
    transform: "translateY(6px)",
    boxShadow: "0 0 0 #FF1493",
  }
};

// Glassy modal with border and shadow
const MODAL_STYLES = {
  boxShadow: "0 20px 50px rgba(255, 105, 180, 0.3)",
  border: "4px solid #FFB6C1",
  borderRadius: "30px",
  background: "linear-gradient(135deg, #FFF5EE 0%, #FFE4E1 100%)",
  backdropFilter: "blur(10px)",
  padding: "20px",
  position: "relative",
  "&:before": {
    content: '""',
    position: "absolute",
    top: "-15px",
    left: "-15px",
    right: "-15px",
    bottom: "-15px",
    border: "3px dashed #FFA07A",
    borderRadius: "35px",
    animation: "rotate 10s linear infinite",
    pointerEvents: "none"
  }
};

// Modern input with focus/hover effect
const INPUT_STYLES = {
  borderRadius: "20px",
  border: "3px solid #FFB6C1",
  padding: "16px 24px",
  background: "#FFF5EE",
  fontSize: "1rem",
  fontWeight: "500",
  color: "#FF69B4",
  transition: "all 0.3s ease",
  boxShadow: "0 4px 8px rgba(255, 182, 193, 0.2)",
  fontFamily: "'Comic Sans MS', cursive",
  "&:focus": {
    border: "3px solid #FF69B4",
    boxShadow: "0 4px 12px rgba(255, 105, 180, 0.3)",
    outline: "none"
  },
  "&::placeholder": {
    color: "#FFB6C1",
    opacity: 0.7
  }
};

const ProfilePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedChildId, setSelectedChildId] = useState(location.state?.selectedChildId || localStorage.getItem('selectedChildId'));
  const { setSelectedChild } = useContext(SelectedChildContext);

  // Mobile detection hook
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen for changes to selectedChildId in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newSelectedChildId = localStorage.getItem('selectedChildId');
      if (newSelectedChildId !== selectedChildId) {
        setSelectedChildId(newSelectedChildId);
      }
    };
    
    // Listen for storage events (when localStorage is changed from another tab)
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically for same-tab changes
    const interval = setInterval(handleStorageChange, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [selectedChildId]);

  // State management
  const [userData, setUserData] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Local operation states so global loading (used for initial fetch) doesn't hide the page
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    firstname: '',
    middlename: '',
    lastname: '',
    contactnumber: '',
    emailaddress: '',
    parentfirstname: '',
    parentmiddlename: '',
    parentlastname: ''
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Profile toast state (center-top) to match other pages
  const [showProfileToast, setShowProfileToast] = useState(false);
  const [profileToastType, setProfileToastType] = useState('updated'); // 'created'|'updated'|'deleted'
  const [profileToastEntity, setProfileToastEntity] = useState('Profile');
  const [profileCreatedName, setProfileCreatedName] = useState('');

  // Get user details from localStorage (normalize role to lowercase)
  const userRole = (localStorage.getItem('userRole') || '').toLowerCase();
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetchUserProfile();
  }, [selectedChildId]);
  // quiet=false will toggle global isLoading; set quiet=true to refresh data without hiding the page
  const fetchUserProfile = async (quiet = false) => {
    if (!userId || !userRole) {
      showAlertMessage('danger', 'User session not found. Please login again.');
      return;
    }

    if (!quiet) setIsLoading(true);
    try {
      let userData;

      // Fetch user profile data
      const { data: userProfile, error: userProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userProfileError) throw userProfileError;
      if (!userProfile) throw new Error('User profile not found');

      userData = userProfile;

      // If parent, fetch all children. If a selectedChildId exists use it; otherwise default to the first child.
      if (userRole === 'parent') {
        const { data: childrenData, error: childrenError } = await supabase
          .from('students')
          .select(`
            *,
            sections (
              id,
              name,
              time_period,
              classroom_number,
              school_year
            )
          `)
          .eq('parent_id', userId);

        if (childrenError) throw childrenError;
        userData.children = childrenData || [];

        // If a specific child id was provided, fetch that child's full record (to ensure sections are included)
        if (selectedChildId) {
          const { data: childData, error: childError } = await supabase
            .from('students')
            .select(`
              *,
              sections (
                id,
                name,
                time_period,
                classroom_number,
                school_year
              )
            `)
            .eq('id', selectedChildId)
            .maybeSingle();

          if (childError) throw childError;
          if (childData) {
            userData.selectedChild = childData;
          }
        }

        // If no selectedChild was set but we have children, default to the first child
        if (!userData.selectedChild && userData.children && userData.children.length > 0) {
          userData.selectedChild = userData.children[0];
          // Try to update the shared SelectedChild context for immediate same-tab updates.
          try {
            const cid = userData.selectedChild.id;
            const fname = userData.selectedChild.first_name || userData.selectedChild.firstName || '';
            const mname = userData.selectedChild.middle_name || userData.selectedChild.middleName || '';
            const lname = userData.selectedChild.last_name || userData.selectedChild.lastName || '';
            const childName = [fname, mname, lname].filter(Boolean).join(' ').trim();
            if (typeof setSelectedChild === 'function') {
              setSelectedChild(String(cid), childName || null);
            } else {
              try { localStorage.setItem('selectedChildId', String(cid)); } catch(e) {}
              try { if (childName) localStorage.setItem('userName', childName); } catch(e) {}
            }
          } catch (e) {
            try { localStorage.setItem('selectedChildId', String(userData.selectedChild.id)); } catch(e) {}
          }
        }
      }

      // If teacher, fetch sections assigned to this teacher
      if (userRole === 'teacher') {
        try {
          const { data: sectionsData, error: sectionsError } = await supabase
            .from('sections')
            .select(`id, name, time_period, classroom_number, school_year, is_active`)
            .eq('teacher_id', userId)
            .order('name', { ascending: true });

          if (sectionsError) {
            userData.sections = [];
          } else {
            userData.sections = sectionsData || [];
          }
        } catch (err) {
          userData.sections = [];
        }
      }

      setUserData(userData);
      setFormData({
        firstname: userData.selectedChild?.first_name || userData.first_name || '',
        middlename: userData.selectedChild?.middle_name || userData.middle_name || '',
        lastname: userData.selectedChild?.last_name || userData.last_name || '',
        contactnumber: userData.contact || userData.contact_number || userData.contactnumber || '',
        emailaddress: userData.email || userData.emailaddress || '',
        parentfirstname: userData.first_name || '',
        parentmiddlename: userData.middle_name || userData.middlename || '',
        parentlastname: userData.last_name || '',
        childDOB: userData.selectedChild?.date_of_birth || userData.selectedChild?.dateOfBirth || '',
        childStudentId: userData.selectedChild?.student_id || userData.selectedChild?.studentId || '',
        childSectionId: userData.selectedChild?.section_id || userData.selectedChild?.sectionId || '',
      });

      if (userData.profile_picture_url) {
        // If profile_picture_url is an object path (no protocol), create a signed URL for rendering.
        try {
          if (/^https?:\/\//i.test(userData.profile_picture_url)) {
            setProfileImage(userData.profile_picture_url);
          } else {
            const signed = await createSignedUrl('profile-pictures', userData.profile_picture_url, 60 * 60);
            setProfileImage(signed || userData.profile_picture_url);
          }
        } catch (err) {
          setProfileImage(userData.profile_picture_url);
        }
      }
    } catch (error) {
      showAlertMessage('danger', error.message || 'Error fetching profile data');
    } finally {
      if (!quiet) setIsLoading(false);
    }
  };

  const showAlertMessage = (type, message) => {
    // Convert existing alert usage to the themed profile toast
    const toastType = (type === 'danger' || type === 'warning' || type === 'error') ? 'deleted' : 'updated';
    setProfileToastType(toastType);
    // Put the message into the small subtitle area
    setProfileCreatedName(message || '');
    setProfileToastEntity('Profile');
    setShowProfileToast(true);
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
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
    
    // Clear error for this field when user starts typing
    if (passwordErrors[name]) {
      setPasswordErrors({
        ...passwordErrors,
        [name]: ''
      });
    }
  };
  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation
    if (!formData.firstname.trim()) newErrors.firstname = 'First name is required';
    if (!formData.lastname.trim()) newErrors.lastname = 'Last name is required';
    if (formData.contactnumber && !/^\d{11}$/.test(formData.contactnumber.trim())) 
      newErrors.contactnumber = 'Contact number must be exactly 11 digits';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};
    if (!passwordData.password) {
      newErrors.password = 'Password is required';
    } else if (passwordData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (passwordData.password !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      let dataToUpdate;

      if (userRole === 'parent') {
        // Parents can edit both their own profile and their selected child's profile
        // Update child first (if selectedChild exists)
        if (userData?.selectedChild?.id) {
          const childUpdate = {
            first_name: formData.firstname.trim(),
            last_name: formData.lastname.trim(),
          };
          if (formData.middlename?.trim()) childUpdate.middle_name = formData.middlename.trim();

          const { error: childError } = await supabase
            .from('students')
            .update(childUpdate)
            .eq('id', userData.selectedChild.id);

          if (childError) throw childError;
        }

        // Update parent profile (contact/email/name)
        const parentUpdate = {
          first_name: formData.parentfirstname.trim(),
          last_name: formData.parentlastname.trim(),
        };
        if (formData.parentmiddlename?.trim()) parentUpdate.middle_name = formData.parentmiddlename.trim();
  if (formData.contactnumber?.trim()) parentUpdate.contact = formData.contactnumber.trim();

        const { error: parentError } = await supabase
          .from('user_profiles')
          .update(parentUpdate)
          .eq('id', userId);

        if (parentError) throw parentError;
      } else if (userRole === 'student') {
        // Update student profile
        dataToUpdate = {
          first_name: formData.firstname.trim(),
          last_name: formData.lastname.trim(),
        };

        if (formData.middlename?.trim()) {
          dataToUpdate.middle_name = formData.middlename.trim();
        }

        const { error } = await supabase
          .from('students')
          .update(dataToUpdate)
          .eq('id', userId);

        if (error) throw error;
      } else if (userRole === 'teacher' || userRole === 'admin') {
        // Update teacher or admin profile in user_profiles
        const profileUpdate = {
          first_name: formData.firstname.trim(),
          last_name: formData.lastname.trim(),
        };
        if (formData.middlename?.trim()) profileUpdate.middle_name = formData.middlename.trim();
  if (formData.contactnumber?.trim()) profileUpdate.contact = formData.contactnumber.trim();

        const { error: profileError } = await supabase
          .from('user_profiles')
          .update(profileUpdate)
          .eq('id', userId);

        if (profileError) throw profileError;
      }

  showAlertMessage('success', 'Profile updated successfully');
  // show themed toast
  setProfileToastEntity('Profile');
  setProfileToastType('updated');
  setProfileCreatedName('');
  setShowProfileToast(true);
  await fetchUserProfile(true);
      setShowEditModal(false);
    } catch (error) {
      showAlertMessage('danger', error.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    if (e) e.preventDefault();
    if (!validatePasswordForm()) return;

    try {
      setIsPasswordUpdating(true);

      // Validate session
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        showAlertMessage('danger', 'Authentication session missing. Please log in again.');
        return;
      }

      // Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: passwordData.password,
      });

      if (error) {
        throw error;
      }

  showAlertMessage('success', 'Password updated successfully');
  setProfileToastEntity('Password');
  setProfileToastType('updated');
  setProfileCreatedName('');
  setShowProfileToast(true);
      setShowPasswordModal(false);
      setPasswordData({ password: '', confirmPassword: '' });
    } catch (error) {
      showAlertMessage('danger', error.message || 'Error updating password');
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  const uploadProfilePicture = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`; // store object path under userId folder

      // Attempt secure deletion of previous file if we have an object path stored
      if (userData?.profile_picture_url) {
        try {
          // userData.profile_picture_url is now expected to be the object path
          await secureDeleteFile('profile-pictures', userData.profile_picture_url, userId, userRole === 'student' ? 'students' : 'user_profiles');
        } catch (error) {
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Store object path in DB (not the public url)
      const { error: updateError } = await supabase
        .from(userRole === 'student' ? 'students' : 'user_profiles')
        .update({ profile_picture_url: filePath })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Return the object path (we'll render via signed URL)
      return filePath;
    } catch (error) {
      throw error;
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // Modified handleImageChange to use Supabase storage
  const handleImageChange = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showAlertMessage('danger', 'Please upload an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlertMessage('danger', 'Image size should be less than 5MB');
        return;
      }

  // Show image upload state without hiding page
  setIsUploadingImage(true);

      // Create temporary preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);

    // Upload to Supabase and update profile (stores object path)
    const objectPath = await uploadProfilePicture(file);
    // get signed url for rendering
    const signed = await createSignedUrl('profile-pictures', objectPath, 60 * 60);
    setProfileImage(signed || objectPath);
  showAlertMessage('success', 'Profile picture updated successfully');
  setProfileToastEntity('Profile picture');
  setProfileToastType('updated');
  setProfileCreatedName('');
  setShowProfileToast(true);

  // Refresh user data to get the updated profile picture without hiding page
  await fetchUserProfile(true);
    } catch (error) {
      showAlertMessage('danger', error.message || 'Error updating profile picture');
    } finally {
      setIsUploadingImage(false);
    }
  };
  const handleProfilePictureChange = async (file) => {
    try {
      setIsUploadingImage(true);

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showAlertMessage('danger', 'Please upload an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showAlertMessage('danger', 'Image size should be less than 5MB');
        return;
      }

      const filePath = `${userId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from(userRole === 'student' ? 'students' : 'user_profiles')
        .update({ profile_picture_url: filePath })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Render via signed URL
      const signed = await createSignedUrl('profile-pictures', filePath, 60 * 60);
      setProfileImage(signed || filePath);
      showAlertMessage('success', 'Profile picture updated successfully');
    } catch (error) {
      showAlertMessage('danger', error.message || 'Error updating profile picture');
    } finally {
      setIsUploadingImage(false);
    }
  };
  const cardStyle = {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    background: "#fff",
    overflow: "hidden",
    borderRadius: "16px"
  };
  return (
    <>
      <div className="d-flex min-vh-100" style={{
        background: `radial-gradient(circle at 90% 0%, rgba(123, 63, 228, 0.07) 0%, transparent 50%)`,
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
        overflowX: "hidden",
        position: "relative"
      }}>
        <SideMenu selectedItem="Profile" isModalOpen={showEditModal || showPasswordModal} />
        <div style={isMobile ? mobileMainContentStyle : mainContentStyle}>
          <style>
            {`
              /* Desktop line separator - smaller and centered */
              .profile-info-section-desktop {
                position: relative;
              }
              .profile-info-section-desktop::before {
                content: '';
                position: absolute;
                left: -20px;
                top: 50%;
                transform: translateY(-50%);
                width: 2px;
                height: 85%;
                background: #68D391;
                border-radius: 1px;
              }
              
              @media (max-width: 768px) {
                .profile-mobile-header {
                  text-align: center !important;
                }
                .profile-mobile-header h4 {
                  font-size: 1.5rem !important;
                  margin-bottom: 0.5rem !important;
                }
                .profile-mobile-header p {
                  font-size: 0.9rem !important;
                  margin-bottom: 0 !important;
                }
                .profile-card-mobile {
                  margin: 0.5rem !important;
                  padding: 1rem !important;
                  border-radius: 20px !important;
                  max-height: none !important;
                  height: auto !important;
                }
                .profile-avatar-mobile {
                  width: 100px !important;
                  height: 100px !important;
                }
                .profile-info-grid-mobile .col-sm-6,
                .profile-info-grid-mobile .col-xs-12 {
                  margin-bottom: 0.8rem !important;
                  padding: 0.3rem 0.5rem !important;
                }
                .profile-info-grid-mobile h6 {
                  font-size: 18px !important;
                  line-height: 1.4 !important;
                  margin-bottom: 0.5rem !important;
                }
                .profile-info-grid-mobile p {
                  font-size: 18px !important;
                  margin-bottom: 0.2rem !important;
                }
                /* Desktop / default profile action button (larger, restored size) */
                .profile-action-btn {
                  padding: 7px 16px !important;
                  font-size: 0.88rem !important;
                  margin: 0.2rem !important;
                  border-radius: 16px !important;
                  font-weight: 600 !important;
                  letter-spacing: 0.25px !important;
                }

                /* Mobile variant (slightly smaller but still roomy) */
                .profile-button-mobile {
                  padding: 6px 12px !important;
                  font-size: 0.8rem !important;
                  margin: 0.2rem !important;
                }
                .profile-modal-mobile .modal-content {
                  margin: 0.5rem !important;
                  border-radius: 15px !important;
                  max-height: 90vh !important;
                  overflow: hidden !important;
                  display: flex !important;
                  flex-direction: column !important;
                }
                .profile-modal-mobile .modal-body {
                  padding: 1rem !important;
                  max-height: calc(90vh - 180px) !important;
                  overflow-y: auto !important;
                  flex: 1 !important;
                  margin-bottom: 10px !important;
                }
                .profile-modal-mobile .modal-header {
                  padding: 1rem 1rem 0.5rem 1rem !important;
                  flex-shrink: 0 !important;
                }
                .profile-modal-mobile .modal-footer {
                  flex-shrink: 0 !important;
                  padding: 1rem !important;
                  margin-top: 0 !important;
                  position: sticky !important;
                  bottom: 0 !important;
                  background: white !important;
                  z-index: 10 !important;
                }
                .profile-modal-mobile .modal-title {
                  font-size: 1.1rem !important;
                }
                .profile-modal-mobile .row {
                  margin: 0 !important;
                }
                .profile-modal-mobile .col-md-4,
                .profile-modal-mobile .col-md-6 {
                  padding: 0.3rem !important;
                  margin-bottom: 0.5rem !important;
                }
                .profile-modal-mobile .form-group {
                  margin-bottom: 0.5rem !important;
                }
                .profile-modal-mobile .mb-3,
                .profile-modal-mobile .mb-4 {
                  margin-bottom: 0.5rem !important;
                }
                .profile-modal-mobile .form-label {
                  font-size: 0.8rem !important;
                  margin-bottom: 0.2rem !important;
                }
                .profile-modal-mobile .form-control {
                  padding: 0.5rem !important;
                  font-size: 0.8rem !important;
                }
                .profile-modal-mobile .form-text {
                  font-size: 0.7rem !important;
                }
                /* Password modal mobile styles */
                .profile-password-modal-mobile .modal-content {
                  margin: 0.5rem !important;
                  border-radius: 15px !important;
                  max-height: 85vh !important;
                  overflow: hidden !important;
                  display: flex !important;
                  flex-direction: column !important;
                }
                .profile-password-modal-mobile .modal-body {
                  padding: 1rem !important;
                  max-height: calc(85vh - 140px) !important;
                  overflow-y: auto !important;
                  flex: 1 !important;
                }
                .profile-password-modal-mobile .modal-header {
                  padding: 1rem 1rem 0.5rem 1rem !important;
                  flex-shrink: 0 !important;
                }
                .profile-password-modal-mobile .modal-footer {
                  flex-shrink: 0 !important;
                  padding: 1rem !important;
                  margin-top: 0 !important;
                }
                .profile-password-modal-mobile .modal-title {
                  font-size: 1.1rem !important;
                }
                .profile-password-modal-mobile .form-label {
                  font-size: 0.85rem !important;
                  margin-bottom: 0.3rem !important;
                }
                .profile-password-modal-mobile .form-group {
                  margin-bottom: 1rem !important;
                }
                .profile-password-modal-mobile p {
                  font-size: 0.8rem !important;
                }
                /* Mobile layout improvements */
                .card-block {
                  padding: 1rem !important;
                }
                .user-card-full {
                  margin: 0.25rem !important;
                  max-height: none !important;
                  height: auto !important;
                }
                .d-flex.gap-2:not(.modal-footer) {
                  flex-direction: column !important;
                  gap: 0.5rem !important;
                }
                /* Keep modal footer buttons in row */
                .modal-footer.d-flex.gap-2 {
                  flex-direction: row !important;
                  gap: 0.5rem !important;
                }
                /* Ensure text is visible and readable */
                .text-muted {
                  color: #495057 !important;
                }
                /* Fix any potential overflow issues */
                .profile-info-grid-mobile {
                  overflow: visible !important;
                  margin-top: 1rem !important;
                }
                /* Add spacing between information sections on mobile */
                @media (max-width: 768px) {
                  .m-t-40 {
                    margin-top: 1.5rem !important;
                  }
                  .m-b-20 {
                    margin-bottom: 1rem !important;
                  }
                  /* Reduce header spacing on mobile */
                  .profile-info-grid-mobile {
                    margin-top: 0.5rem !important;
                  }
                  /* Adjust main information header on mobile */
                  h6[style*="fontSize: \"26px\""] {
                    font-size: 22px !important;
                    margin-bottom: 1rem !important;
                  }
                }
                /* Mobile specific layout */
                .user-profile {
                  min-height: auto !important;
                  height: auto !important;
                }
                /* Ensure mobile columns stack properly */
                .col-xs-12.col-sm-5,
                .col-xs-12.col-sm-7 {
                  flex: 0 0 100% !important;
                  max-width: 100% !important;
                  margin-bottom: 1rem !important;
                }
                /* Hide line separator on mobile */
                .profile-info-section-mobile {
                  padding-left: 1rem !important;
                }
                .profile-info-section-mobile::before {
                  display: none !important;
                }
              }
            `}
          </style>
          <div className={`p-2 ${isMobile ? 'profile-mobile-header' : ''}`}>
            <div className="d-flex flex-column align-items-start mb-3">
              <div>
                <h4 className="mb-1">My Profile</h4>
                <p className="text-muted mb-0">View and manage your personal information</p>
              </div>
            </div>
          </div>

          {/* Center-top themed toast for profile actions */}
          <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', top: 16, zIndex: 1060 }}>
            <Toast onClose={() => setShowProfileToast(false)} show={showProfileToast} delay={3000} autohide style={{ borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', overflow: 'hidden', background: colors.contentBg, border: `1px solid ${colors.borderColor}` }}>
              <Toast.Body style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, background: profileToastType === 'created' ? colors.success : profileToastType === 'updated' ? colors.info : colors.danger }}>
                  {profileToastType === 'deleted' ? '!' : profileToastType === 'updated' ? '✓' : 'i'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{profileToastType === 'created' ? `${profileToastEntity} created` : profileToastType === 'updated' ? `${profileToastEntity} updated` : `${profileToastEntity} deleted`}</div>
                  <div style={{ fontSize: 13, color: colors.mutedText }}>{profileCreatedName || (profileToastType === 'created' ? 'Successfully created' : profileToastType === 'updated' ? 'Successfully updated' : 'Successfully deleted')}</div>
                </div>
                <button onClick={() => setShowProfileToast(false)} style={{ background: 'transparent', border: 'none', color: colors.mutedText, cursor: 'pointer' }} aria-label="Close">×</button>
              </Toast.Body>
            </Toast>
          </div>
          {/* Alerts replaced by themed center-top toast */}
          <div className="p-2 d-flex flex-column align-items-center justify-content-center" style={{ 
            minHeight: isMobile ? "auto" : "calc(100vh - 160px)", 
            width: "100%", 
            maxWidth: "100%", 
            overflowX: "hidden",
            paddingBottom: isMobile ? "2rem" : "0"
          }}>
            {isLoading ? (
              <div className="text-center my-5 py-5">
                <div className="bg-white rounded-circle p-4 d-inline-flex mb-4" style={{ boxShadow: "0 8px 24px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(78, 13, 209, 0.06)" }}>
                  <Spinner animation="border" role="status" variant="primary" style={{ width: "3rem", height: "3rem" }}>
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
                <p className="text-muted">Loading your profile information...</p>
              </div>
            ) : userData ? (
                    <Row className="d-flex justify-content-center w-100">
                      <Col xs={12}>
                        <Card className={`user-card-full ${isMobile ? 'profile-card-mobile' : ''}`} style={{...CARD_STYLES, maxWidth: "min(98vw, 1200px)", width: "100%", margin: "0 auto"}}>
                          <Row className="m-l-0 m-r-0" style={{ 
                            minHeight: isMobile ? "auto" : "min(500px, 70vh)", 
                            maxHeight: isMobile ? "none" : "min(600px, 75vh)" 
                          }}>
                            {/* Left Profile Section */}
                            <Col xs={12} sm={5} className="bg-c-lite-green user-profile" style={{
                              background: "transparent",
                              borderRadius: "5px 0 0 5px",
                              padding: "20px 0"
                            }}>
                              <div className="card-block text-center" style={{ 
                                padding: "clamp(0.75rem, 2.5vw, 2rem)", 
                                color: "#FF1493", 
                                fontFamily: "'Comic Sans MS', 'Bubblegum Sans', cursive"
                              }}>
                                <div className="m-b-25" style={{ marginBottom: "clamp(15px, 4vw, 25px)" }}>
                                  <div 
                                    className={isMobile ? 'profile-avatar-mobile' : ''}
                                    style={{ 
                                      position: "relative", 
                                      width: "clamp(100px, 18vw, 180px)", 
                                      height: "clamp(100px, 18vw, 180px)",
                                      margin: "0 auto"
                                    }}
                                  >
                                    <div
                                      onClick={handleImageClick}
                                      className="d-flex align-items-center justify-content-center"
                                      style={{ 
                                        width: "100%", 
                                        height: "100%",
                                        borderRadius: "50%",
                                        cursor: "pointer",
                                        overflow: "hidden",
                                        transition: "all 0.3s ease",
                                        border: "5px solid #FFD700",
                                        boxShadow: "0 0 25px rgba(255, 215, 0, 0.8)",
                                        background: "linear-gradient(45deg, #FF69B4, #00CED1)"
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "scale(1.02)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "scale(1)";
                                      }}
                                    >
                                      {profileImage ? (
                                        <img 
                                          src={profileImage} 
                                          alt="Profile" 
                                          className="img-radius"
                                          style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit: "cover",
                                            borderRadius: "50%",
                                            border: "5px solid #FFD700",
                                            boxShadow: "0 0 25px rgba(255, 215, 0, 0.8)"
                                          }}
                                        />
                                      ) : (
                                        <FiUser size={80} color="white" />
                                      )}
                                    </div>
                                    {/* Enhanced Camera Indicator */}
                                    <div
                                      onClick={handleImageClick}
                                      style={{
                                        position: "absolute",
                                        bottom: "8px",
                                        right: "8px",
                                        backgroundColor: "#ffffff",
                                        borderRadius: "50%",
                                        padding: "8px",
                                        cursor: "pointer",
                                        transition: "all 0.3s ease",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                                        border: "2px solid #ee5a6f",
                                        width: "36px",
                                        height: "36px"
                                      }}
                                      className="d-flex align-items-center justify-content-center"
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "scale(1.1)";
                                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "scale(1)";
                                        e.currentTarget.style.backgroundColor = "#ffffff";
                                      }}
                                    >
                                      <FaCamera size={16} color="#ee5a6f" />
                                    </div>
                                  </div>
                                  <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                  />
                                </div>
                                <h6 className="f-w-600" style={{ fontWeight: "600", fontSize: "18px", color: "#2B6CB0", fontFamily: "'Segoe UI', 'Trebuchet MS', sans-serif", marginBottom: "10px" }}>
                                  {(userRole === 'user') ? 'Olivia Salem' : (
                                    userData && (userData.firstname || userData.first_name) && (userData.lastname || userData.last_name) ? 
                                      `${userData.firstname || userData.first_name} ${userData.lastname || userData.last_name}` : 
                                      userData && (userData.name || userData.full_name) ? 
                                        userData.name || userData.full_name :
                                        'Name not available'
                                  )}
                                </h6>
                                <p style={{ lineHeight: "25px", fontSize: "15px", color: "#68D391", fontWeight: "500", fontFamily: "'Segoe UI', 'Trebuchet MS', sans-serif" }}>
                                  {userRole === 'user' ? '⭐ Student' : userRole === 'teacher' ? '📚 Teacher' : userRole === 'parent' ? '👨‍👩‍👧 Parent' : '👑 Admin'}
                                </p>
                                <div className="d-flex gap-2 mt-3 justify-content-center">
                                  <Button 
                                    variant="outline-primary" 
                                    className={`profile-action-btn ${isMobile ? 'profile-button-mobile' : ''}`}
                                    onClick={() => setShowEditModal(true)}
                                    style={{ 
                                      padding: "7px 16px",
                                      borderRadius: "16px", 
                                      fontSize: "0.88rem",
                                      fontFamily: "'Segoe UI', 'Trebuchet MS', sans-serif",
                                      borderColor: "#2B6CB0",
                                      color: "#2B6CB0",
                                      transition: "all 0.3s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = "#2B6CB0";
                                      e.target.style.color = "white";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = "transparent";
                                      e.target.style.color = "#2B6CB0";
                                    }}
                                  >
                                    <FiEdit2 size={12} className="me-1" /> Edit Profile
                                  </Button>
                                  <Button 
                                    variant="outline-secondary" 
                                    className={`profile-action-btn ${isMobile ? 'profile-button-mobile' : ''}`}
                                    onClick={() => setShowPasswordModal(true)}
                                    style={{ 
                                      padding: "7px 16px",
                                      borderRadius: "16px", 
                                      fontSize: "0.88rem",
                                      fontFamily: "'Segoe UI', 'Trebuchet MS', sans-serif",
                                      borderColor: "#E53E3E",
                                      color: "#E53E3E",
                                      transition: "all 0.3s ease"
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = "#E53E3E";
                                      e.target.style.color = "white";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = "transparent";
                                      e.target.style.color = "#E53E3E";
                                    }}
                                  >
                                    <FiInfo size={12} className="me-1" /> Change Password
                                  </Button>
                                </div>
                                {userRole === 'parent' && (
                                  <div className="d-flex justify-content-center mt-3">
                                    <Button 
                                      variant="outline-success" 
                                      className={`profile-action-btn ${isMobile ? 'profile-button-mobile' : ''}`}
                                      onClick={() => navigate('/choose')}
                                      style={{ 
                                        padding: "7px 16px",
                                        borderRadius: "16px", 
                                        fontSize: "0.88rem",
                                        fontFamily: "'Segoe UI', 'Trebuchet MS', sans-serif",
                                        borderColor: "green",
                                        color: "green",
                                        transition: "all 0.3s ease"
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.backgroundColor = "green";
                                        e.target.style.color = "white";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.backgroundColor = "transparent";
                                        e.target.style.color = "green";
                                      }}
                                    >
                                      Switch Children
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </Col>
                            

                            {/* Right Information Section */}
                            <Col xs={12} sm={7} style={{ position: "relative", display: "flex", alignItems: "stretch" }}>
                              <div 
                                className={isMobile ? 'profile-info-section-mobile' : 'profile-info-section-desktop'}
                                style={{
                                  borderLeft: "none",
                                  height: "100%",
                                  paddingLeft: "20px",
                                  width: "100%"
                                }}
                              >
                              <div className="card-block" style={{ 
                                padding: "clamp(0.75rem, 2.5vw, 2rem)", 
                                height: "100%", 
                                maxHeight: isMobile ? "calc(100vh - 280px)" : "calc(75vh - 60px)",
                                overflowY: "auto", 
                                overflowX: "hidden",
                                fontFamily: "'Segoe UI', 'Trebuchet MS', sans-serif",
                                scrollbarWidth: "thin",
                                scrollbarColor: "#68D391 #f1f1f1"
                              }}>
                                {/* Removed the My Information section */}
                                {userRole === 'user' && userData?.sections && (
                                  <Row>
                                    <Col xs={12} sm={6}>
                                      <p className="m-b-10 f-w-600" style={{
                                        marginBottom: "15px",
                                        fontWeight: "600",
                                        fontSize: "18px"
                                      }}>
                                        Section
                                      </p>
                                      <h6 className="text-muted f-w-400" style={{
                                        color: "#919aa3",
                                        fontWeight: "400",
                                        fontSize: "18px",
                                        lineHeight: "35px"
                                      }}>
                                        {userData?.sections?.section_name || 'Not assigned'}
                                      </h6>
                                    </Col>
                                  </Row>
                                )}
                                
                                {userRole === 'user' && (
                                  <>

                                    <Row className={`${isMobile ? 'profile-info-grid-mobile' : ''} align-items-start`}>
                                      <Col sm={6}>
                                        <p className="m-b-10 f-w-600" style={{
                                          marginBottom: "15px",
                                          fontWeight: "600",
                                          fontSize: "18px"
                                        }}>
                                          Parent Name
                                        </p>
                                        <h6 className="text-muted f-w-400" style={{
                                          color: "#919aa3",
                                          fontWeight: "400",
                                          fontSize: "18px",
                                          lineHeight: "35px"
                                        }}>
                                          {`${userData.parentfirstname || 'Not specified'} ${userData.parentlastname || ''}`}
                                        </h6>
                                      </Col>
                                      {/* Teacher assigned sections */}
                                      {userRole === 'teacher' && (
                                        <Col sm={12} className="mt-3">
                                          <p className="m-b-10 f-w-600" style={{
                                            marginTop: "8px",
                                            marginBottom: "6px",
                                            fontWeight: "600",
                                            fontSize: "18px"
                                          }}>
                                            Assigned Section
                                          </p>
                                          {userData?.sections && userData.sections.length > 0 ? (
                                            <div>
                                              {userData.sections.map(sec => (
                                                <div key={sec.id} style={{ padding: '8px 12px', borderRadius: 8, background: '#fff', marginBottom: 8, border: '1px solid #e9ecef' }}>
                                                  <strong style={{ display: 'block', fontSize: 16 }}>{sec.name}</strong>
                                                  <small style={{ color: '#6c757d' }}>{sec.time_period || ''} • Room {sec.classroom_number || '—'} • {sec.school_year || '—'}</small>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div style={{ color: '#6c757d' }}>No sections assigned</div>
                                          )}
                                        </Col>
                                      )}
                                    </Row>
                                  </>
                                )}
                                {userRole === 'parent' && !userData.selectedChild && userData.children && userData.children.length > 0 && (
                                  <>
                                    <h6 className="m-b-20 m-t-40 p-b-5 b-b-default f-w-600" style={{
                                      marginBottom: "25px",
                                      marginTop: "25px",
                                      paddingBottom: "8px",
                                      borderBottom: "1px solid #e0e0e0",
                                      fontWeight: "600",
                                      fontSize: "26px"
                                    }}>
                                      Children Information
                                    </h6>
                                    <Row className={`${isMobile ? 'profile-info-grid-mobile' : ''} align-items-start`}>
                                      {userData.children.map((child, index) => (
                                        <Col sm={6} key={index}>
                                          <p className="m-b-10 f-w-600" style={{
                                            marginBottom: "15px",
                                            fontWeight: "600",
                                            fontSize: "18px"
                                          }}>
                                            {`Child ${index + 1}`}
                                          </p>
                                          <h6 className="text-muted f-w-400" style={{
                                            color: "#919aa3",
                                            fontWeight: "400",
                                            fontSize: "18px",
                                            lineHeight: "35px"
                                          }}>
                                            Name: {`${child.first_name} ${child.last_name}`}<br />
                                            Date of Birth: {child.date_of_birth || 'Not specified'}<br />
                                            Student ID: {child.student_id || 'Not specified'}<br />
                                            Section ID: {child.section_id || 'Not assigned'}<br />
                                            Enrollment Date: {child.enrollment_date || 'Not specified'}<br />
                                            Active: {child.is_active ? 'Yes' : 'No'}
                                          </h6>
                                        </Col>
                                      ))}
                                    </Row>
                                  </>
                                )}
                                {userRole === 'parent' && userData.selectedChild && (
                                  <>
                                    <h6 className="m-b-20 m-t-40 p-b-5 b-b-default f-w-600" style={{
                                      marginBottom: "25px",
                                      marginTop: "25px",
                                      paddingBottom: "8px",
                                      borderBottom: "1px solid #e0e0e0",
                                      fontWeight: "600",
                                      fontSize: "26px"
                                    }}>
                                      Child Information
                                    </h6>
                                    <Row className={`${isMobile ? 'profile-info-grid-mobile' : ''} align-items-start`}>
                                      <Col sm={6}>
                                        <p className="m-b-10 f-w-600" style={{
                                          marginBottom: "15px",
                                          fontWeight: "600",
                                          fontSize: "18px"
                                        }}>
                                          Name
                                        </p>
                                        <h6 className="text-muted f-w-400" style={{
                                          color: "#919aa3",
                                          fontWeight: "400",
                                          fontSize: "18px",
                                          lineHeight: "35px"
                                        }}>
                                          {`${userData.selectedChild?.first_name || ''} ${userData.selectedChild?.middle_name || ''} ${userData.selectedChild?.last_name || ''}`.trim() || 'N/A'}
                                        </h6>
                                      </Col>
                                      <Col sm={6}>
                                        <p className="m-b-10 f-w-600" style={{
                                          marginBottom: "15px",
                                          fontWeight: "600",
                                          fontSize: "18px"
                                        }}>
                                          Date of Birth
                                        </p>
                                        <h6 className="text-muted f-w-400" style={{
                                          color: "#919aa3",
                                          fontWeight: "400",
                                          fontSize: "18px",
                                          lineHeight: "35px"
                                        }}>
                                          {formData.childDOB || 'N/A'}
                                        </h6>
                                      </Col>
                                      <Col sm={6}>
                                        <p className="m-b-10 f-w-600" style={{
                                          marginBottom: "15px",
                                          fontWeight: "600",
                                          fontSize: "18px"
                                        }}>
                                          Student ID
                                        </p>
                                        <h6 className="text-muted f-w-400" style={{
                                          color: "#919aa3",
                                          fontWeight: "400",
                                          fontSize: "18px",
                                          lineHeight: "35px"
                                        }}>
                                          {formData.childStudentId || 'N/A'}
                                        </h6>
                                      </Col>
                                      <Col sm={6}>
                                        <p className="m-b-10 f-w-600" style={{
                                          marginBottom: "15px",
                                          fontWeight: "600",
                                          fontSize: "18px"
                                        }}>
                                          Section
                                        </p>
                                        <h6 className="text-muted f-w-400" style={{
                                          color: "#919aa3",
                                          fontWeight: "400",
                                          fontSize: "18px",
                                          lineHeight: "35px"
                                        }}>
                                          {userData?.selectedChild?.sections ? (
                                            <>
                                              {userData.selectedChild.sections.name}<br/>
                                              <small style={{ fontSize: '14px', color: '#666' }}>
                                                {userData.selectedChild.sections.time_period.charAt(0).toUpperCase() + 
                                                 userData.selectedChild.sections.time_period.slice(1)} |&nbsp;
                                                Room {userData.selectedChild.sections.classroom_number} |&nbsp;
                                                SY {userData.selectedChild.sections.school_year}
                                              </small>
                                            </>
                                          ) : 'Not Assigned'}
                                        </h6>
                                      </Col>
                                      <h6 className="m-b-20 m-t-40 p-b-5 b-b-default f-w-600" style={{
                                        marginBottom: "25px",
                                        marginTop: "25px",
                                        paddingBottom: "8px",
                                        borderBottom: "1px solid #e0e0e0",
                                        fontWeight: "600",
                                        fontSize: "26px"
                                      }}>
                                        Parent Information
                                      </h6>
                                      <Col sm={6}>
                                        <p className="m-b-10 f-w-600" style={{
                                          marginBottom: "15px",
                                          fontWeight: "600",
                                          fontSize: "18px"
                                        }}>
                                          Parent Name
                                        </p>
                                        <h6 className="text-muted f-w-400" style={{
                                          color: "#919aa3",
                                          fontWeight: "400",
                                          fontSize: "18px",
                                          lineHeight: "35px"
                                        }}>
                                          {`${userData.first_name || ''} ${userData.middle_name || ''} ${userData.last_name || ''}`.trim() || 'N/A'}
                                        </h6>
                                      </Col>
                                      <Col sm={6}>
                                        <p className="m-b-10 f-w-600" style={{
                                          marginBottom: "15px",
                                          fontWeight: "600",
                                          fontSize: "18px"
                                        }}>
                                          Parent Email
                                        </p>
                                        <h6 className="text-muted f-w-400" style={{
                                          color: "#919aa3",
                                          fontWeight: "400",
                                          fontSize: "18px",
                                          lineHeight: "35px"
                                        }}>
                                          {formData.emailaddress || 'N/A'}
                                        </h6>
                                      </Col>
                                      <Col sm={6}>
                                          <p className="m-b-10 f-w-600" style={{
                                            marginTop: "10px",
                                            marginBottom: "15px",
                                            fontWeight: "600",
                                            fontSize: "18px"
                                          }}>
                                          Contact
                                        </p>
                                        <h6 className="text-muted f-w-400" style={{
                                          color: "#919aa3",
                                          fontWeight: "400",
                                          fontSize: "18px",
                                          lineHeight: "35px"
                                        }}>
                                          {formData.contactnumber || 'N/A'}
                                        </h6>
                                      </Col>
                                    </Row>
                                  </>
                                )}
                                {/* Teacher and Admin Profile Information */}
                                {(userRole === 'teacher' || userRole === 'admin') && (
                                  <>
                                    <h6 className="m-b-20 m-t-40 p-b-5 b-b-default f-w-600" style={{
                                      marginBottom: "25px",
                                      marginTop: "25px",
                                      paddingBottom: "8px",
                                      borderBottom: "1px solid #e0e0e0",
                                      fontWeight: "600",
                                      fontSize: "26px"
                                    }}>
                                      {userRole === 'teacher' ? 'Teacher Information' : 'Admin Information'}
                                    </h6>
                                    <Row className={`${isMobile ? 'profile-info-grid-mobile' : ''} align-items-start`}>
                                      <Col sm={6}>
                                        <p className="m-b-10 f-w-600" style={{
                                          marginBottom: "15px",
                                          fontWeight: "600",
                                          fontSize: "18px"
                                        }}>
                                          Full Name
                                        </p>
                                        <h6 className="text-muted f-w-400" style={{
                                          color: "#919aa3",
                                          fontWeight: "400",
                                          fontSize: "18px",
                                          lineHeight: "35px"
                                        }}>
                                          {`${userData.first_name || ''} ${userData.middle_name || ''} ${userData.last_name || ''}`.trim() || 'N/A'}
                                        </h6>
                                      </Col>
                                      <Col sm={6}>
                                        <p className="m-b-10 f-w-600" style={{
                                          marginBottom: "15px",
                                          fontWeight: "600",
                                          fontSize: "18px"
                                        }}>
                                          Email Address
                                        </p>
                                        <h6 className="text-muted f-w-400" style={{
                                          color: "#919aa3",
                                          fontWeight: "400",
                                          fontSize: "18px",
                                          lineHeight: "35px"
                                        }}>
                                          {userData.email || 'N/A'}
                                        </h6>
                                      </Col>
                                      <Col sm={6}>
                                        <p className="m-b-10 f-w-600" style={{
                                          marginTop: "8px",
                                          marginBottom: "15px",
                                          fontWeight: "600",
                                          fontSize: "18px"
                                        }}>
                                          Contact
                                        </p>
                                        <h6 className="text-muted f-w-400" style={{
                                          color: "#919aa3",
                                          fontWeight: "400",
                                          fontSize: "18px",
                                          lineHeight: "35px"
                                        }}>
                                          {userData.contact || userData.contact_number || 'N/A'}
                                        </h6>
                                      </Col>
                                      {userRole === 'teacher' && (
                                        <Col sm={6}>
                                          <p className="m-b-10 f-w-600" style={{
                                            marginTop: "8px",
                                            marginBottom: "6px",
                                            fontWeight: "600",
                                            fontSize: "18px"
                                          }}>
                                            Assigned Section
                                          </p>
                                          {userData?.sections && userData.sections.length > 0 ? (
                                            <div>
                                              {userData.sections.map(sec => (
                                                <div key={sec.id} style={{ padding: '4px 8px', borderRadius: 6, marginBottom: 6 }}>
                                                  <strong style={{ display: 'block', fontSize: 15 }}>{sec.name}</strong>
                                                  <small style={{ color: '#6c757d' }}>{sec.time_period || ''} • Room {sec.classroom_number || '—'}</small>
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div style={{ color: '#6c757d' }}>No sections assigned</div>
                                          )}
                                        </Col>
                                      )}
                                    </Row>
                                  </>
                                )}
                              </div>
                              </div>
                            </Col>
                          </Row>
                        </Card>
                      </Col>
                    </Row>
            ) : (
              <Alert 
                variant="warning" 
                style={{ marginTop: "20px" }}
              >
                No data available.
              </Alert>
            )}
          </div>

          {/* Edit Profile Modal */}
          <Modal show={showEditModal} onHide={() => {
            setFormData({
              firstname: userData.selectedChild?.first_name || userData.first_name || '',
              middlename: userData.selectedChild?.middle_name || userData.middle_name || '',
              lastname: userData.selectedChild?.last_name || userData.last_name || '',
              contactnumber: userData.contact || userData.contact_number || userData.contactnumber || '',
              emailaddress: userData.email || '',
              parentfirstname: userData.first_name || '',
              parentmiddlename: userData.middle_name || '',
              parentlastname: userData.last_name || '',
              childDOB: userData.selectedChild?.date_of_birth || '',
              childStudentId: userData.selectedChild?.student_id || '',
              childSectionId: userData.selectedChild?.section_id || '',
            });
            setErrors({});
            setShowEditModal(false);
          }} centered>
            <Modal.Header closeButton>
              <Modal.Title>Edit Profile</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleUpdateProfile}>
                {userRole === 'parent' ? (
                  <>
                    {/* Child Name Fields */}
                    <h6 className="mb-3">Child Information</h6>
                    <Row className="g-2">
                      <Col xs={12} md={4}>
                        <Form.Group controlId="formChildFirstName">
                          <Form.Label className="small text-muted">Child First Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.firstname}
                            onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                            style={{ borderRadius: 12, padding: '8px 10px', fontSize: '0.95rem', border: '1px solid #d1d5db' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={4}>
                        <Form.Group controlId="formChildMiddleName">
                          <Form.Label className="small text-muted">Child Middle Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.middlename}
                            onChange={(e) => setFormData({ ...formData, middlename: e.target.value })}
                            style={{ borderRadius: 12, padding: '8px 10px', fontSize: '0.95rem', border: '1px solid #d1d5db' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={4}>
                        <Form.Group controlId="formChildLastName">
                          <Form.Label className="small text-muted">Child Last Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.lastname}
                            onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                            style={{ borderRadius: 12, padding: '8px 10px', fontSize: '0.95rem', border: '1px solid #d1d5db' }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    {/* Parent Name Fields */}
                    <h6 className="mt-4 mb-3">Parent Information</h6>
                    <Row className="g-2">
                      <Col xs={12} md={4}>
                        <Form.Group controlId="formParentFirstName">
                          <Form.Label className="small text-muted">Parent First Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.parentfirstname}
                            onChange={(e) => setFormData({ ...formData, parentfirstname: e.target.value })}
                            style={{ borderRadius: 12, padding: '8px 10px', fontSize: '0.95rem', border: '1px solid #d1d5db' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={4}>
                        <Form.Group controlId="formParentMiddleName">
                          <Form.Label className="small text-muted">Parent Middle Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.parentmiddlename}
                            onChange={(e) => setFormData({ ...formData, parentmiddlename: e.target.value })}
                            style={{ borderRadius: 12, padding: '8px 10px', fontSize: '0.95rem', border: '1px solid #d1d5db' }}
                          />
                        </Form.Group>
                      </Col>
                      <Col xs={12} md={4}>
                        <Form.Group controlId="formParentLastName">
                          <Form.Label className="small text-muted">Parent Last Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.parentlastname}
                            onChange={(e) => setFormData({ ...formData, parentlastname: e.target.value })}
                            style={{ borderRadius: 12, padding: '8px 10px', fontSize: '0.95rem', border: '1px solid #d1d5db' }}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                ) : (
                  <Row className="g-2">
                    <Col xs={12} md={4}>
                      <Form.Group controlId="formFirstName">
                        <Form.Label className="small text-muted">First Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.firstname}
                          onChange={(e) => setFormData({ ...formData, firstname: e.target.value })}
                          style={{ borderRadius: 12, padding: '8px 10px', fontSize: '0.95rem', border: '1px solid #d1d5db' }}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4}>
                      <Form.Group controlId="formMiddleName">
                        <Form.Label className="small text-muted">Middle Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.middlename}
                          onChange={(e) => setFormData({ ...formData, middlename: e.target.value })}
                          style={{ borderRadius: 12, padding: '8px 10px', fontSize: '0.95rem', border: '1px solid #d1d5db' }}
                        />
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={4}>
                      <Form.Group controlId="formLastName">
                        <Form.Label className="small text-muted">Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.lastname}
                          onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                          style={{ borderRadius: 12, padding: '8px 10px', fontSize: '0.95rem', border: '1px solid #d1d5db' }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                )}

                {/* Contact Information - For all users */}
                <Row className="g-2 mt-2 align-items-start">
                  <Col xs={12} md={6}>
                    <Form.Group controlId="formContactNumber">
                      <Form.Label className="small text-muted">Contact</Form.Label>
                      <Form.Control
                        name="contactnumber"
                        inputMode="numeric"
                        pattern="\d{11}"
                        maxLength={11}
                        type="tel"
                        value={formData.contactnumber}
                        onChange={handleInputChange}
                        placeholder="09xxxxxxxxx"
                        style={{ borderRadius: 12, padding: '8px 10px', fontSize: '0.95rem', border: '1px solid #d1d5db' }}
                      />
                    </Form.Group>
                  </Col>
                  <Col xs={12} md={6}>
                    <Form.Group controlId="formEmailAddress">
                      <Form.Label className="small text-muted">Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        value={formData.emailaddress}
                        readOnly
                        disabled
                        style={{ 
                          borderRadius: 12, 
                          padding: '8px 10px', 
                          fontSize: '0.95rem', 
                          border: '1px solid #d1d5db',
                          backgroundColor: '#f8f9fa',
                          color: '#6c757d',
                          cursor: 'not-allowed'
                        }}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Parent info row */}
                {/* Removed Parent Fields */}

                <div className="d-flex justify-content-end mt-3">
                  <Button
                    variant="outline-success"
                    type="button"
                    onClick={(e) => handleUpdateProfile(e)}
                    disabled={isSaving}
                    style={{ borderRadius: 12, padding: '8px 18px', fontWeight: 600, backgroundColor: 'white', color: 'green', borderColor: 'green' }}
                  >
                    {isSaving ? <Spinner animation="border" size="sm" className="me-1" /> : <FiSave className="me-1" />} {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>

          {/* Change Password Modal */}
          <Modal show={showPasswordModal} onHide={() => {
            setPasswordData({
              password: '',
              confirmPassword: ''
            });
            setPasswordErrors({});
            setShowPasswordModal(false);
          }} centered>
            <Modal.Header closeButton>
              <Modal.Title>Change Password</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleUpdatePassword}>
                <Form.Group controlId="formNewPassword">
                  <Form.Label>New Password</Form.Label>
                  <div style={{ position: 'relative' }}>
                    <Form.Control
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.password}
                      onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
                      isInvalid={!!passwordErrors.password}
                      style={{ borderRadius: 12, padding: '8px 40px 8px 10px', fontSize: '0.95rem', border: '1px solid #d1d5db' }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                      {showPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                    </button>
                    <Form.Control.Feedback type="invalid">
                      {passwordErrors.password}
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>
                <Form.Group controlId="formConfirmPassword">
                  <Form.Label>Confirm Password</Form.Label>
                  <div style={{ position: 'relative' }}>
                    <Form.Control
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      isInvalid={!!passwordErrors.confirmPassword}
                      style={{ borderRadius: 12, padding: '8px 40px 8px 10px', fontSize: '0.95rem', border: '1px solid #d1d5db' }}
                    />
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label="Toggle confirm password visibility" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                      {showConfirmPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                    </button>
                    <Form.Control.Feedback type="invalid">
                      {passwordErrors.confirmPassword}
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <Button variant="outline-success" type="submit" disabled={isPasswordUpdating} style={{ borderRadius: 12, padding: '6px 12px', fontWeight: 600, backgroundColor: 'white', color: 'green', borderColor: 'green' }}>
                    {isPasswordUpdating ? <Spinner animation="border" size="sm" /> : 'Update Password'}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
