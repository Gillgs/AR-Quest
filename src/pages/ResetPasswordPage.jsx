import { supabase } from "../config/supabase";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { colors } from "../styles/constants";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setShowSuccess(false);
    setShowError(false);

    if (password !== confirmPassword) {
      setShowError(true);
      setErrorMessage("Passwords do not match.");
      setIsLoading(false);
      return;
    }


    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (!error) {
        setShowSuccess(true);
        // After a brief delay so the user sees confirmation, redirect to login
        setTimeout(() => navigate('/login'), 1200);
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
                <h4 style={{ color: colors.primary, fontWeight: "600" }}>
                  Reset Password
                </h4>
                <p className="text-muted">
                  Enter your new password below.
                </p>
              </div>

              {showSuccess && (
                <Alert variant="success" className="mb-3">
                  Your password has been updated successfully. You can now log in with your new password.
                </Alert>
              )}

              {showError && (
                <Alert variant="danger" className="mb-3">
                  {errorMessage}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: "600", color: colors.primary }}>
                    New Password
                  </Form.Label>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                  <Form.Label style={{ fontWeight: "600", color: colors.primary }}>
                    Confirm New Password
                  </Form.Label>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      padding: "12px",
                      borderRadius: "15px",
                      border: "1px solid #152AC8",
                      backgroundColor: "rgba(21, 42, 200, 0.15)"
                    }}
                  />
                </Form.Group>

                <Form.Group className="mb-3 d-flex align-items-center">
                  <Form.Check
                    type="checkbox"
                    id="show-password"
                    label={<span style={{ fontWeight: 600, color: colors.primary }}>Show password</span>}
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                  />
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
                  {isLoading ? "Updating..." : "Update Password"}
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

export default ResetPasswordPage;
