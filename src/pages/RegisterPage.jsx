import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { colors } from "../styles/constants";
import { supabase } from "../config/supabase";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    studentFirstName: "",
    studentMiddleName: "",
    studentLastName: "",
    parentFirstName: "",
    parentMiddleName: "",
    parentLastName: "",
    email: "",
    contactNumber: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setIsPageVisible(true);
    return () => setIsPageVisible(false);
  }, []);

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = [
      'studentFirstName',
      'studentLastName',
      'parentFirstName',
      'parentLastName',
      'email',
      'contactNumber',
      'password',
      'confirmPassword'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = 'This field is required';
      }
    });

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.confirmPassword && formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Philippine phone number validation
    if (formData.contactNumber) {
      const phoneRegex = /^0\d{10}$/;
      if (!phoneRegex.test(formData.contactNumber)) {
        newErrors.contactNumber = 'Enter a valid 11-digit phone number starting with 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      // First create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });


      if (authError) throw authError;
      if (!authData.user) {
        throw new Error('Registration failed: No user data returned');
      }


      // Admin registration logic
      let profileData;
      if (formData.email.trim().toLowerCase() === 'admin@example.com') {
        profileData = {
          id: authData.user.id,
          first_name: 'Default',
          last_name: 'Admin',
          username: 'admin',
          role: 'admin'
        };
      } else {
        profileData = {
          id: authData.user.id,
          first_name: formData.parentFirstName.trim(),
          last_name: formData.parentLastName.trim(),
          username: formData.email.split('@')[0],
          role: 'parent'
        };
      }

      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert(profileData);


      if (insertError) {
        await supabase.auth.signOut();
        throw new Error('Failed to create user profile: ' + insertError.message);
      }

      // For parent accounts, also create the student record
      if (profileData.role === 'parent') {
        // Generate a unique student ID
        const { data: existingStudents, error: countError } = await supabase
          .from('students')
          .select('student_id', { count: 'exact', head: true });
        
        const studentCount = (existingStudents?.length || 0) + 1;
        const studentId = `STU${String(studentCount).padStart(3, '0')}`;
        
        const studentData = {
          first_name: formData.studentFirstName.trim(),
          middle_name: formData.studentMiddleName.trim() || null,
          last_name: formData.studentLastName.trim(),
          parent_id: authData.user.id,
          student_id: studentId,
          emailaddress: formData.email, // Store parent's email for reference
          contact_number: formData.contactNumber
        };

        const { error: studentError } = await supabase
          .from('students')
          .insert(studentData);

        if (studentError) {
          // Don't fail the entire registration if student creation fails
        }
      }

      if (authData.user.email_confirmed_at) {
        setErrorMessage('Registration successful! You can now login with your credentials.');
      } else {
        setErrorMessage('Registration successful! Please check your email and click the verification link before logging in.');
      }
      setShowError(true);
      setTimeout(() => {
        navigate('/login');
      }, 4000);
    } catch (error) {
      setErrorMessage('Registration failed: ' + (error.message || 'Unknown error'));
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'contactNumber') {
      // Only allow digits and limit to 11 characters
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
    <div
      style={{
        backgroundImage: "url(/images/Desktopbg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}
    >
      <Container className="d-flex justify-content-center align-items-center px-3">
        <div
          className={`shadow-lg register-container ${isPageVisible ? 'page-visible' : ''}`}
          style={{
            width: "100%",
            maxWidth: "1100px",
            minHeight: "500px",
            maxHeight: "600px",
            height: "auto",
            boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
            borderRadius: "20px",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(to right, #FFFFFF 50%, #479EE5 50%)",
            opacity: 0,
            transform: "translateY(20px)",
            transition: "opacity 0.6s ease-out, transform 0.6s ease-out"
          }}
        >
          {showError && (
            <div 
              className="floating-error"
              style={{
                position: "absolute",
                top: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 1000,
                width: "auto",
                minWidth: "300px"
              }}
            >
              <Alert
                variant="danger"
                className="mb-0 text-center"
                style={{
                  borderRadius: "8px",
                  animation: "shake 0.5s ease-in-out, float-error 3s ease-out forwards",
                  fontSize: "0.9rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              >
                {errorMessage}
              </Alert>
            </div>
          )}

          <Row className="h-100 g-0">
            {/* Form Section - Changed to match login layout */}
            <Col
              lg={6}
              md={12}
              className="p-3 p-md-4 d-flex flex-column"
              style={{
                background: "transparent",
                borderTopLeftRadius: "20px",
                borderBottomLeftRadius: "20px",
                minHeight: "400px",
                maxHeight: "600px"
              }}
            >
              {/* Header Section - Moved to left */}
              <div className="position-absolute" style={{ top: "15px", left: "15px", zIndex: "5" }}>
                <Link 
                  to="/login"
                  className="back-button"
                  style={{
                    background: "rgba(21, 42, 200, 0.1)",
                    color: "#152AC8",
                    padding: "6px 12px",
                    borderRadius: "15px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    fontSize: "0.9rem",
                    boxShadow: "0 2px 6px rgba(21, 42, 200, 0.1)",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "rgba(21, 42, 200, 0.2)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 8px rgba(21, 42, 200, 0.2)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "rgba(21, 42, 200, 0.1)";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(21, 42, 200, 0.1)";
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-arrow-left me-1" viewBox="0 0 16 16">
                    <path fillRule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8z"/>
                  </svg>
                  Back
                </Link>
              </div>

              <div className="text-center mb-2 mb-md-3 mt-4">
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  style={{ 
                    height: "30px", 
                    marginBottom: "10px"
                  }}
                />
                <h4 style={{ color: "#152AC8", fontWeight: "600", fontSize: "1.1rem" }}>Register New Student</h4>
              </div>

              {/* Scrollable Form Section with proper padding */}
              <div className="flex-grow-1" style={{ 
                overflowY: "auto", 
                paddingRight: "15px", 
                marginRight: "-15px" 
              }}>
                <Form onSubmit={handleSubmit} className="px-2">
                  {/* Student Information */}
                  <h6 className="mb-3" style={{ color: "#152AC8", fontSize: "0.9rem", fontWeight: "600" }}>Student Information</h6>
                  <Row className="mb-3 g-2 g-md-3">
                    <Col lg={4} md={6} sm={12}>
                      <Form.Group className="mb-0" style={{ height: '80px' }}>
                        <Form.Label style={{ fontSize: "0.85rem", marginBottom: "2px" }}>First Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="studentFirstName"
                          value={formData.studentFirstName}
                          onChange={handleInputChange}
                          isInvalid={!!errors.studentFirstName}
                          style={{
                            height: "40px",
                            fontSize: "0.85rem",
                            borderRadius: "12px",
                            border: "1px solid #152AC8",
                            backgroundColor: "rgba(21, 42, 200, 0.15)",
                          }}
                        />
                        <Form.Control.Feedback type="invalid" style={{ fontSize: "0.75rem" }}>
                          {errors.studentFirstName}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col lg={4} md={6} sm={12}>
                      <Form.Group className="mb-0" style={{ height: '80px' }}>
                        <Form.Label style={{ fontSize: "0.85rem", marginBottom: "2px" }}>Middle Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="studentMiddleName"
                          value={formData.studentMiddleName}
                          onChange={handleInputChange}
                          style={{
                            height: "40px",
                            fontSize: "0.85rem",
                            borderRadius: "12px",
                            border: "1px solid #152AC8",
                            backgroundColor: "rgba(21, 42, 200, 0.15)",
                          }}
                        />
                        {/* Hidden element to ensure consistent height with error fields */}
                        <div style={{ height: "24px" }}></div>
                      </Form.Group>
                    </Col>
                    <Col lg={4} md={12} sm={12}>
                      <Form.Group className="mb-0" style={{ height: '80px' }}>
                        <Form.Label style={{ fontSize: "0.85rem", marginBottom: "2px" }}>Last Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="studentLastName"
                          value={formData.studentLastName}
                          onChange={handleInputChange}
                          isInvalid={!!errors.studentLastName}
                          style={{
                            height: "40px",
                            fontSize: "0.85rem",
                            borderRadius: "12px",
                            border: "1px solid #152AC8",
                            backgroundColor: "rgba(21, 42, 200, 0.15)",
                          }}
                        />
                        <Form.Control.Feedback type="invalid" style={{ fontSize: "0.75rem" }}>
                          {errors.studentLastName}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Parent Information */}
                  <h6 className="mb-3 mt-4" style={{ color: "#152AC8", fontSize: "0.9rem", fontWeight: "600" }}>Parent Information</h6>
                  <Row className="mb-3 g-2 g-md-3">
                    <Col lg={4} md={6} sm={12}>
                      <Form.Group className="mb-0" style={{ height: '80px' }}>
                        <Form.Label style={{ fontSize: "0.85rem", marginBottom: "2px" }}>First Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="parentFirstName"
                          value={formData.parentFirstName}
                          onChange={handleInputChange}
                          isInvalid={!!errors.parentFirstName}
                          style={{
                            height: "40px",
                            fontSize: "0.85rem",
                            borderRadius: "12px",
                            border: "1px solid #152AC8",
                            backgroundColor: "rgba(21, 42, 200, 0.15)",
                          }}
                        />
                        <Form.Control.Feedback type="invalid" style={{ fontSize: "0.75rem" }}>
                          {errors.parentFirstName}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col lg={4} md={6} sm={12}>
                      <Form.Group className="mb-0" style={{ height: '80px' }}>
                        <Form.Label style={{ fontSize: "0.85rem", marginBottom: "2px" }}>Middle Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="parentMiddleName"
                          value={formData.parentMiddleName}
                          onChange={handleInputChange}
                          style={{
                            height: "40px",
                            fontSize: "0.85rem",
                            borderRadius: "12px",
                            border: "1px solid #152AC8",
                            backgroundColor: "rgba(21, 42, 200, 0.15)",
                          }}
                        />
                        {/* Hidden element to ensure consistent height with error fields */}
                        <div style={{ height: "24px" }}></div>
                      </Form.Group>
                    </Col>
                    <Col lg={4} md={12} sm={12}>
                      <Form.Group className="mb-0" style={{ height: '80px' }}>
                        <Form.Label style={{ fontSize: "0.85rem", marginBottom: "2px" }}>Last Name *</Form.Label>
                        <Form.Control
                          type="text"
                          name="parentLastName"
                          value={formData.parentLastName}
                          onChange={handleInputChange}
                          isInvalid={!!errors.parentLastName}
                          style={{
                            height: "40px",
                            fontSize: "0.85rem",
                            borderRadius: "12px",
                            border: "1px solid #152AC8",
                            backgroundColor: "rgba(21, 42, 200, 0.15)",
                          }}
                        />
                        <Form.Control.Feedback type="invalid" style={{ fontSize: "0.75rem" }}>
                          {errors.parentLastName}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Contact Information */}
                  <h6 className="mb-3 mt-4" style={{ color: "#152AC8", fontSize: "0.9rem", fontWeight: "600" }}>Contact Information</h6>
                  <Row className="mb-3 g-2 g-md-3">
                    <Col lg={6} md={12} sm={12}>
                      <Form.Group className="mb-0" style={{ height: '80px' }}>
                        <Form.Label style={{ fontSize: "0.85rem", marginBottom: "2px" }}>Email Address *</Form.Label>
                        <Form.Control
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          isInvalid={!!errors.email}
                          style={{
                            height: "40px",
                            fontSize: "0.85rem",
                            borderRadius: "12px",
                            border: "1px solid #152AC8",
                            backgroundColor: "rgba(21, 42, 200, 0.15)",
                          }}
                        />
                        <Form.Control.Feedback type="invalid" style={{ fontSize: "0.75rem" }}>
                          {errors.email}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col lg={6} md={12} sm={12}>
                      <Form.Group className="mb-0" style={{ height: '80px' }}>
                        <Form.Label style={{ fontSize: "0.85rem", marginBottom: "2px" }}>Contact Number *</Form.Label>
                        <Form.Control
                          type="tel"
                          name="contactNumber"
                          value={formData.contactNumber}
                          onChange={handleInputChange}
                          isInvalid={!!errors.contactNumber}
                          placeholder="0XXX XXX XXXX"
                          maxLength={11}
                          style={{
                            height: "40px",
                            fontSize: "0.85rem",
                            borderRadius: "12px",
                            border: "1px solid #152AC8",
                            backgroundColor: "rgba(21, 42, 200, 0.15)",
                          }}
                        />
                        <Form.Control.Feedback type="invalid" style={{ fontSize: "0.75rem" }}>
                          {errors.contactNumber}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Password Fields */}
                  <h6 className="mb-3 mt-4" style={{ color: "#152AC8", fontSize: "0.9rem", fontWeight: "600" }}>Security</h6>
                  <Row className="mb-4 g-2 g-md-3">
                    <Col lg={6} md={12} sm={12}>
                      <Form.Group className="mb-0" style={{ height: '80px' }}>
                        <Form.Label style={{ fontSize: "0.85rem", marginBottom: "2px" }}>Password *</Form.Label>
                        <Form.Control
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          isInvalid={!!errors.password}
                          style={{
                            height: "40px",
                            fontSize: "0.85rem",
                            borderRadius: "12px",
                            border: "1px solid #152AC8",
                            backgroundColor: "rgba(21, 42, 200, 0.15)",
                          }}
                          placeholder="Enter your password"
                        />
                        <Form.Control.Feedback type="invalid" style={{ fontSize: "0.75rem" }}>
                          {errors.password}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col lg={6} md={12} sm={12}>
                      <Form.Group className="mb-0" style={{ height: '80px' }}>
                        <Form.Label style={{ fontSize: "0.85rem", marginBottom: "2px" }}>Confirm Password *</Form.Label>
                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          isInvalid={!!errors.confirmPassword}
                          style={{
                            height: "40px",
                            fontSize: "0.85rem",
                            borderRadius: "12px",
                            border: "1px solid #152AC8",
                            backgroundColor: "rgba(21, 42, 200, 0.15)",
                          }}
                          placeholder="Confirm your password"
                        />
                        <Form.Control.Feedback type="invalid" style={{ fontSize: "0.75rem" }}>
                          {errors.confirmPassword}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Register Button */}
                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 py-2 fw-bold mb-3"
                    style={{
                      background: "#07125F",
                      border: "none",
                      borderRadius: "12px",
                      letterSpacing: "1px",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      transition: "transform 0.3s, box-shadow 0.3s",
                      fontSize: "0.9rem",
                      height: "45px",
                      marginTop: "12px"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 8px rgba(0, 0, 0, 0.15)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Registering...
                      </>
                    ) : "REGISTER"}
                  </Button>

                  <div className="text-center" style={{ marginTop: "4px" }}>
                    <div style={{ fontSize: "0.85rem" }}>
                      <span className="text-muted">Already have an account? </span>
                      <Link 
                        to="/login"
                        style={{ color: "#3283FC", textDecoration: "none", fontWeight: "500" }}
                      >
                        Login here
                      </Link>
                    </div>
                  </div>
                </Form>
              </div>
            </Col>

            {/* Image Section */}
            <Col
              lg={6}
              md={12}
              className="d-none d-lg-flex"
              style={{
                background: "transparent",
                alignItems: "center",
                justifyContent: "center",
                borderTopRightRadius: "20px",
                borderBottomRightRadius: "20px",
                minHeight: "400px",
                maxHeight: "600px"
              }}
            >
              <div className="text-center p-4 w-100">
                <img
                  src="/images/book_image.png"
                  alt="Book"
                  className="img-fluid"
                  style={{
                    maxHeight: "400px",
                    maxWidth: "100%",
                    objectFit: "contain",
                    animation: "float 4s ease-in-out infinite"
                  }}
                />
              </div>
            </Col>
          </Row>
        </div>
      </Container>
      
      <style>
        {`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }

          @keyframes float-error {
            0% { 
              opacity: 0;
              transform: translateY(-20px);
            }
            10% {
              opacity: 1;
              transform: translateY(0);
            }
            90% {
              opacity: 1;
              transform: translateY(0);
            }
            100% {
              opacity: 0;
              transform: translateY(-20px);
            }
          }

          .form-control {
            transition: all 0.3s ease !important;
          }
          .form-control:focus {
            transform: translateY(-2px);
            box-shadow: 0 5px 10px rgba(21, 42, 200, 0.15) !important;
          }

          .page-visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
          }
          
          /* Mobile responsive: solid white background when image is hidden */
          @media (max-width: 991.98px) {
            .register-container {
              background: #FFFFFF !important;
            }
          }
          
          @media (max-width: 991.98px) {
            .register-container {
              margin: 10px;
            }
            
            .register-form {
              border-radius: 20px !important;
              padding: 15px;
            }
          }
          
          @media (max-width: 768px) {
            .register-container {
              margin: 5px;
            }
            
            .register-form {
              padding: 10px;
            }
            
            .back-button {
              font-size: 0.8rem !important;
              padding: 4px 8px !important;
            }
            
            .form-control {
              height: 35px !important;
              font-size: 0.8rem !important;
            }
            
            .form-label {
              font-size: 0.8rem !important;
            }
          }
          
          @media (max-width: 576px) {
            .register-form {
              padding: 8px;
            }
            
            h4 {
              font-size: 1rem !important;
            }
            
            h6 {
              font-size: 0.85rem !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default RegisterPage;
