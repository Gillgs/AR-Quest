import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { supabase } from "../config/supabase";

const VerificationPage = () => {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState("");
  const handleSendResetCode = async () => {
    setIsSending(true);
    setSendSuccess(false);
    setSendError("");
    if (!email) {
      setSendError("Email is required.");
      setIsSending(false);
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        setSendError(error.message);
      } else {
        setSendSuccess(true);
      }
    } catch (e) {
      setSendError(e.message);
    } finally {
      setIsSending(false);
    }
  };
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    // Try to get email from navigation state
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  // On mount, detect if the URL contains a magic-link/session params and exchange them
  React.useEffect(() => {
    const tryConsumeMagicLink = async () => {
      try {
        const href = window.location.href;
        if (!href) return;
        // Quick heuristic: Supabase magic links include access_token or type=magiclink
        if (href.includes('access_token') || href.includes('type=magiclink') || href.includes('refresh_token')) {
          setIsSending(true);
          const { data, error } = await supabase.auth.getSessionFromUrl();
          if (error) {
            setSendError('Failed to complete sign-in from email link. Please try signing in from the app.');
            setIsSending(false);
            return;
          }
          if (data?.session) {
            // Successful sign-in via magic link. Fetch profile and redirect appropriately.
            const userId = data.session.user.id;
            try {
              const { data: profile, error: profileErr } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();
              if (profileErr) {
              }
              if (profile) {
                localStorage.setItem('userRole', profile.role);
                localStorage.setItem('userId', userId);
                localStorage.setItem('userProfile', JSON.stringify(profile));
                localStorage.setItem('userName', `${profile.first_name || ''} ${profile.last_name || ''}`);
                localStorage.setItem('userEmail', data.session.user.email || '');

                // Redirect based on role
                switch ((profile.role || '').toUpperCase()) {
                  case 'ADMIN':
                    navigate('/admin');
                    break;
                  case 'TEACHER':
                    navigate('/classroom');
                    break;
                  case 'PARENT':
                    navigate('/choose');
                    break;
                  case 'STUDENT':
                  case 'USER':
                    navigate('/home');
                    break;
                  default:
                    navigate('/home');
                }
                setSendSuccess(true);
                setIsSending(false);
                return;
              }
            } catch (e) {
            }
          }
          setIsSending(false);
        }
      } catch (e) {
        setIsSending(false);
      }
    };

    tryConsumeMagicLink();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setShowSuccess(false);
    setShowError(false);

    if (!email) {
      setShowError(true);
      setErrorMessage('Email is required for verification.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        type: 'email',
        token: otp,
        email: email
      });
      if (!error) {
        setShowSuccess(true);
        setTimeout(() => {
          navigate("/reset-password", { state: { email } });
        }, 1200);
      } else {
        setShowError(true);
        setErrorMessage('Invalid or expired OTP code.');
      }
    } catch (err) {
      setShowError(true);
      setErrorMessage('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
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
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5}>
            <div
              className="bg-white p-4 shadow-lg"
              style={{
                borderRadius: "20px",
                animation: "fadeIn 0.5s ease-out"
              }}
            >
              <div className="text-center mb-4">
                <img
                  src="/images/logo.png"
                  alt="Logo"
                  style={{ height: "45px", marginBottom: "30px" }}
                />
                <h4 style={{ color: "#152AC8", fontWeight: "600" }}>
                  Email Verification
                </h4>
                <p className="text-muted">
                  Enter the OTP code sent to your email to verify your account.
                </p>
              </div>

              {showSuccess && (
                <Alert variant="success" className="mb-3">
                  Your email has been verified successfully!
                </Alert>
              )}

              {showError && (
                <Alert variant="danger" className="mb-3">
                  {errorMessage}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "600", color: "#152AC8" }}>
                    Email Address
                  </Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      padding: "12px",
                      borderRadius: "15px",
                      border: "1px solid #152AC8",
                      backgroundColor: "rgba(21, 42, 200, 0.15)"
                    }}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "600", color: "#152AC8" }}>
                    OTP Code
                  </Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter OTP code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    style={{
                      padding: "12px",
                      borderRadius: "15px",
                      border: "1px solid #152AC8",
                      backgroundColor: "rgba(21, 42, 200, 0.15)"
                    }}
                  />
                  <Button
                    variant="outline-primary"
                    className="w-100 py-2 mt-2"
                    onClick={handleSendResetCode}
                    disabled={isSending || !email}
                    style={{
                      borderRadius: "15px",
                      fontWeight: "bold",
                      letterSpacing: "1px"
                    }}
                  >
                    {isSending ? "Sending..." : "Resend Code"}
                  </Button>
                  {sendSuccess && (
                    <Alert variant="success" className="mb-3 mt-2">
                      Verification code sent to your email!
                    </Alert>
                  )}
                  {sendError && (
                    <Alert variant="danger" className="mb-3 mt-2">
                      {sendError}
                    </Alert>
                  )}
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 py-2 mb-3"
                  disabled={isLoading}
                  style={{
                    background: "#07125F",
                    border: "none",
                    borderRadius: "15px",
                    fontWeight: "bold",
                    letterSpacing: "1px"
                  }}
                >
                  {isLoading ? "Verifying..." : "Verify"}
                </Button>
              </Form>
            </div>
          </Col>
        </Row>
      </Container>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default VerificationPage;
