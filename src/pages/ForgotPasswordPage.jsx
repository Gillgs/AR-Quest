import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setShowSuccess(false);
    setShowError(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/reset-password"
      });
      if (!error) {
        setShowSuccess(true);
        setTimeout(() => {
          navigate("/verify");
        }, 1500); // Show success message briefly before navigating
      } else {
        setShowError(true);
        setErrorMessage(error.message);
      }
    } catch (err) {
      setShowError(true);
      setErrorMessage("An error occurred. Please try again.");
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
                  Forgot Password
                </h4>
                <p className="text-muted">
                  Enter your email address and select your role to receive password reset instructions.
                </p>
              </div>

              {showSuccess && (
                <Alert variant="success" className="mb-3">
                  If an account exists with this email, you will receive password reset instructions.
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
                    Role
                  </Form.Label>
                  <Form.Select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    style={{
                      padding: "12px",
                      borderRadius: "15px",
                      border: "1px solid #152AC8",
                      backgroundColor: "rgba(21, 42, 200, 0.15)"
                    }}
                  >
                    <option value="user">User</option>
                    <option value="teacher">Teacher</option>
                  </Form.Select>
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
                  {isLoading ? "Sending..." : "Send Reset Instructions"}
                </Button>

                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-decoration-none"
                    style={{ color: "#3283FC" }}
                  >
                    Back to Login
                  </Link>
                </div>
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

export default ForgotPasswordPage;
