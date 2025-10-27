import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { colors } from "../styles/constants";
import { supabase } from "../config/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showError, setShowError] = useState(false);
  const [role, setRole] = useState("parent");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    setIsPageVisible(true);
    return () => setIsPageVisible(false);
  }, []);

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Password validation function
  const isValidPassword = (password) => {
    return password.trim().length >= 6; // Minimum 6 characters for login (different from registration)
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setShowError(false);

    // Clear previous inline errors
    setEmailError("");
    setPasswordError("");

    // Client-side validations (show inline errors)
    let hasError = false;
    if (!email.trim()) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (!isValidPassword(password)) {
      setPasswordError('Password must be at least 6 characters long');
      hasError = true;
    }

    if (hasError) {
      setErrorMessage('Please fix the highlighted fields');
      setShowError(true);
      // Focus the first invalid input
      if (!email.trim() && emailRef.current) emailRef.current.focus();
      else if (!isValidEmail(email) && emailRef.current) emailRef.current.focus();
      else if (!password.trim() && passwordRef.current) passwordRef.current.focus();
      else if (!isValidPassword(password) && passwordRef.current) passwordRef.current.focus();
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    // Brute force protection
    const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
    const currentTime = new Date().getTime();
    const emailKey = email.trim().toLowerCase();
    const userAttempts = loginAttempts[emailKey] || [];
    const recentAttempts = userAttempts.filter(ts => currentTime - ts < 15 * 60 * 1000); // 15 minutes
    
    if (recentAttempts.length >= 5) {
      const waitTime = Math.ceil((15 * 60 * 1000 - (currentTime - Math.min(...recentAttempts))) / 60000);
      setErrorMessage(`Too many login attempts. Please try again in ${waitTime} minute(s).`);
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
      return;
    }

    setIsLoading(true);

    try {
      // Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password: password 
      });
      

      // Handle authentication errors
      if (authError) {
        // Track failed login attempt
        const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
        const emailKey = email.trim().toLowerCase();
        const userAttempts = loginAttempts[emailKey] || [];
        const currentTime = new Date().getTime();
        const recentAttempts = userAttempts.filter(ts => currentTime - ts < 15 * 60 * 1000);
        loginAttempts[emailKey] = [...recentAttempts, currentTime];
        localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));

        if (authError.message.includes('email not confirmed')) {
          setErrorMessage("Please check your email and click the verification link to confirm your account before logging in.");
        } else if (authError.message.includes('Invalid login credentials')) {
          setErrorMessage("Invalid email or password. Please check your credentials and try again.");
        } else if (authError.message.includes('Too many requests')) {
          setErrorMessage("Too many login attempts. Please wait a moment before trying again.");
        } else {
          setErrorMessage("Login failed. Please check your email and password.");
        }
        setShowError(true);
        setTimeout(() => setShowError(false), 5000);
        setIsLoading(false);
        return;
      }

      if (!authData?.user) {
        setErrorMessage("Login failed. No user data received.");
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
        setIsLoading(false);
        return;
      }

      // Get user profile
      const userId = authData.user.id;
      const { data: profileData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileError || !profileData) {
        setErrorMessage("User profile not found. Please contact support or re-register your account.");
        await supabase.auth.signOut();
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
        setIsLoading(false);
        return;
      }

      // Validate role matches selection
      if (profileData.role?.toLowerCase() !== role.toLowerCase()) {
        setErrorMessage(`Please select the correct role. Your account is registered as '${profileData.role}'.`);
        await supabase.auth.signOut();
        setShowError(true);
        setTimeout(() => setShowError(false), 3000);
        setIsLoading(false);
        return;
      }

      // Clear failed login attempts on successful login
      const loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '{}');
      const emailKey = email.trim().toLowerCase();
      delete loginAttempts[emailKey];
      localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));

      // Save user data and redirect
      localStorage.setItem("userRole", profileData.role);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userProfile", JSON.stringify(profileData));
      localStorage.setItem("userName", `${profileData.first_name} ${profileData.last_name}`);
      localStorage.setItem("userEmail", email.trim());

      // For parent accounts, check if they have students (don't auto-create)
      if (profileData.role.toLowerCase() === 'parent') {
        try {
          const { data: existingChildren } = await supabase
            .from('students')
            .select('id')
            .eq('parent_id', userId)
            .limit(1);

          if (!existingChildren || existingChildren.length === 0) {
          }
        } catch (studentError) {
          // Don't fail the login if student check fails
        }
      }

      // Navigate based on role
      switch (profileData.role.toUpperCase()) {
        case "ADMIN":
          navigate("/admin");
          break;
        case "TEACHER":
          navigate("/classroom");
          break;
        case "PARENT":
          navigate("/choose");
          break;
        case "USER":
        case "STUDENT":
          navigate("/home");
          break;
        default:
          navigate("/home");
      }
    } catch (error) {
      if (!navigator.onLine) {
        setErrorMessage("Please check your internet connection");
      } else if (error.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Login failed: Invalid email or password.");
      }
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Keep password input type in sync with showPassword, using the ref as a fallback
  useEffect(() => {
    try {
      if (passwordRef && passwordRef.current) {
        passwordRef.current.type = showPassword ? 'text' : 'password';
      }
    } catch (e) {
      // ignore
    }
  }, [showPassword]);

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
          className={`shadow-lg login-container ${isPageVisible ? 'page-visible' : ''}`}
          style={{
            width: "100%",
            maxWidth: "1100px",
            minHeight: "400px",
            height: "auto",
            boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
            borderRadius: "20px",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(to right, #479EE5 50%, #FFFFFF 50%)",
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
            {/* Image Section */}
            <Col
              lg={6}
              md={12}
              className="d-none d-lg-flex"
              style={{
                background: "transparent",
                alignItems: "center",
                justifyContent: "center",
                borderTopLeftRadius: "20px",
                borderBottomLeftRadius: "20px",
                minHeight: "400px"
              }}
            >
              <div className="text-center p-4 w-100">
                <img
                  src="/images/book_image.png"
                  alt="Book"
                  className="img-fluid"
                  style={{
                    maxHeight: "580px",
                    maxWidth: "100%",
                    objectFit: "contain",
                    animation: "float 4s ease-in-out infinite"
                  }}
                />
              </div>
            </Col>

            {/* Form Section */}
            <Col
              lg={6}
              md={12}
              className="p-3 p-md-4 d-flex flex-column justify-content-center"
              style={{
                background: "transparent",
                borderTopRightRadius: "20px",
                borderBottomRightRadius: "20px",
                minHeight: "400px"
              }}
            >
              <div 
                className="position-absolute" 
                style={{ 
                  top: "15px", 
                  right: "15px", 
                  zIndex: "5",
                }}
              >
                <Link 
                  to="/home"
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

              <div className="text-center mb-3 mb-md-4">
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  style={{ 
                    height: "35px", 
                    marginBottom: "20px",
                  }}
                />
                <h4 className="mb-3 mb-md-4" style={{ color: "#152AC8", fontWeight: "600", fontSize: "1.5rem" }}>Login to Your Account</h4>
              </div>

              {/* Role selection */}
              <div className="mb-3 mb-md-4">
                <div className="d-flex justify-content-center">
                  <div className="role-button-container">
                    <button
                      type="button"
                      className={`role-button ${role === "parent" ? "active" : ""}`}
                      onClick={() => setRole("parent")}
                    >
                      Parent
                    </button>
                    <button
                      type="button"
                      className={`role-button ${role === "teacher" ? "active" : ""}`}
                      onClick={() => setRole("teacher")}
                    >
                      Teacher
                    </button>
                    <button
                      type="button"
                      className={`role-button ${role === "admin" ? "active" : ""}`}
                      onClick={() => setRole("admin")}
                    >
                      Admin
                    </button>
                    <div 
                      className="slider"
                      style={{
                        transform: role === "parent" 
                          ? "translateX(0)" 
                          : role === "teacher" 
                          ? "translateX(100%)" 
                          : "translateX(200%)",
                        width: "calc(33.33% - 2px)"
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Login Form */}
              <Form onSubmit={handleLogin} className="mb-3">
                <div className="d-flex justify-content-center">
                  <div style={{ width: "100%", maxWidth: "400px" }}>
                    <Form.Group className="mb-3" controlId="formEmail">
                      <Form.Label style={{ fontWeight: "600", color: "#152AC8" }}>
                        Email Address
                      </Form.Label>
                      <Form.Control
                        ref={emailRef}
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                        onBlur={() => {
                          if (!email.trim()) setEmailError('Email is required');
                          else if (!isValidEmail(email)) setEmailError('Please enter a valid email address');
                        }}
                        isInvalid={!!emailError}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "15px",
                          border: "1px solid #152AC8",
                          backgroundColor: "rgba(21, 42, 200, 0.15)",
                          color: "#333"
                        }}
                        className="shadow-sm"
                      />
                      {emailError ? <div className="invalid-feedback d-block">{emailError}</div> : null}
                    </Form.Group>

                    <Form.Group className="mb-4" controlId="formPassword">
                      <Form.Label style={{ fontWeight: "600", color: "#152AC8" }}>
                        Password
                      </Form.Label>
                      <div style={{ position: "relative" }}>
                        <Form.Control
                          ref={passwordRef}
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                          onBlur={() => {
                            if (!password.trim()) setPasswordError('Password is required');
                            else if (!isValidPassword(password)) setPasswordError('Password must be at least 6 characters long');
                          }}
                          isInvalid={!!passwordError}
                          style={{
                            padding: "10px 36px 10px 12px", // reduced right padding to fit small text
                            borderRadius: "15px",
                            border: "1px solid #152AC8",
                            backgroundColor: "rgba(21, 42, 200, 0.15)",
                            color: "#333"
                          }}
                          className="shadow-sm"
                        />

                        {passwordError ? <div className="invalid-feedback d-block">{passwordError}</div> : null}

                        <button
                          type="button"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          title={showPassword ? "Hide password" : "Show password"}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowPassword(prev => !prev); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setShowPassword(prev => !prev); } }}
                          style={{
                            position: "absolute",
                            top: "50%",
                            right: "10px",
                            transform: "translateY(-50%)",
                            color: "#152AC8",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "6px",
                            borderRadius: "8px",
                            fontSize: "1rem",
                            background: "transparent",
                            border: 'none',
                            boxSizing: "border-box"
                          }}
                        >
                          {(!password || password.trim().length === 0)
                            ? <FiEyeOff size={18} />
                            : (showPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />)
                          }
                        </button>
                      </div>
                    </Form.Group>

                    <Button
                      variant="primary"
                      type="submit"
                      className="w-100 py-2 fw-bold"
                      style={{
                        background: "#07125F",
                        border: "none",
                        borderRadius: "15px",
                        letterSpacing: "1px",
                        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        transition: "transform 0.3s, box-shadow 0.3s",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.boxShadow = "0 6px 8px rgba(0, 0, 0, 0.15)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
                      }}
                      disabled={isLoading || !!emailError || !!passwordError || !email.trim() || !password.trim()}
                    >
                      {isLoading ? "Signing In..." : "SIGN IN"}
                    </Button>

                    <div className="text-center mt-3">
                      <div className="mb-2">
                        <Link
                          to="/forgot-password"
                          className="text-decoration-none"
                          style={{ fontSize: "0.9rem", color: "#3283FC" }}
                        >
                          Forgot Password?
                        </Link>
                      </div>
                      
                      {/* Registration link hidden per request */}
                    </div>
                  </div>
                </div>
              </Form>
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
          
          .role-button-container {
            position: relative;
            display: flex;
            background-color: rgba(21, 42, 200, 0.15);
            border-radius: 16px;
            padding: 2px;
            width: 100%;
            max-width: 320px;
            margin: 0 auto;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          @media (max-width: 576px) {
            .role-button-container {
              max-width: 280px;
            }
          }
          
          .role-button {
            flex: 1;
            border: none;
            background: transparent;
            padding: 6px 8px;
            font-weight: 600;
            font-size: 0.9rem;
            color: #333;
            position: relative;
            z-index: 2;
            cursor: pointer;
            transition: color 0.3s;
            border-radius: 14px;
            outline: none;
          }
          
          .role-button.active {
            color: #fff;
          }
          
          .slider {
            position: absolute;
            top: 2px;
            left: 2px;
            width: calc(33.33% - 2px);
            height: calc(100% - 4px);
            background-color: #152AC8;
            border-radius: 14px;
            transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            z-index: 1;
          }

          .page-visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
          }

          .form-control {
            transition: all 0.3s ease !important;
          }
          .form-control:focus {
            transform: translateY(-2px);
            box-shadow: 0 5px 10px rgba(21, 42, 200, 0.15) !important;
          }
          
          /* Mobile responsive: solid white background when image is hidden */
          @media (max-width: 991.98px) {
            .login-container {
              background: #FFFFFF !important;
            }
          }
          
          @media (max-width: 991.98px) {
            .login-container {
              margin: 10px;
            }
            
            .login-form {
              border-radius: 20px !important;
              padding: 20px;
            }
            
            .role-button {
              font-size: 0.8rem;
              padding: 8px 6px;
            }
          }
          
          @media (max-width: 576px) {
            .login-container {
              margin: 5px;
            }
            
            .login-form {
              padding: 15px;
            }
            
            .back-button {
              font-size: 0.8rem !important;
              padding: 4px 8px !important;
            }
          }
        `}
      </style>
    </div>
  );
};
