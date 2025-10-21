import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Container, ListGroup, Image, Button, Modal } from "react-bootstrap";
import { FiGrid, FiUser, FiLogOut, FiBook, FiBarChart2, FiTrendingUp, FiMenu, FiX } from "react-icons/fi";
import DashboardListTile from "./DashboardListTile";
import { colors, shadows, borderRadius } from "../styles/constants";

const MENU_STYLES = {
  width: "220px",
  height: "calc(100vh - 32px)",
  backgroundColor: colors.sideMenuBg,
  transition: "all 0.3s ease",
  position: "fixed",
  top: "16px",
  left: "16px",
  zIndex: 1000,
  boxShadow: shadows.lg,
  borderRadius: borderRadius.md,
  overflow: "hidden"
};

const MOBILE_MENU_STYLES = {
  width: "250px",
  height: "100vh",
  backgroundColor: colors.sideMenuBg,
  transition: "all 0.3s ease",
  position: "fixed",
  top: "0",
  left: "0",
  zIndex: 1050,
  boxShadow: "none",
  overflow: "hidden",
  borderRight: "1px solid rgba(255, 255, 255, 0.1)"
};

const HAMBURGER_BUTTON_STYLES = {
  position: "fixed",
  top: "10px",
  left: "10px",
  zIndex: 1100,
  backgroundColor: colors.sideMenuBg, // Match side menu background
  border: "none",
  borderRadius: "8px",
  padding: "8px",
  display: "flex", // Changed from "none" to "flex"
  transition: "all 0.3s ease",
  color: "#fff",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
};

const OVERLAY_STYLES = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  zIndex: 1040,
  transition: "all 0.3s ease",
  backdropFilter: "blur(2px)"
};

const SideMenu = ({ selectedItem, isModalOpen = false }) => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 992); // Bootstrap lg breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleMobileMenu = () => {
    document.body.style.overflow = !isMobileMenuOpen ? 'hidden' : '';
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    document.body.style.overflow = '';
    setIsMobileMenuOpen(false);
  };

  const doLogout = () => {
    // Perform actual logout: clear local storage and navigate to login
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    closeMobileMenu();
    navigate("/login");
  };

  const handleLogout = () => {
    // Show confirmation modal
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    doLogout();
  };

  const cancelLogout = () => setShowLogoutModal(false);

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      closeMobileMenu();
    }
  };

  const menuStyle = isMobile 
    ? {
        ...MOBILE_MENU_STYLES,
        transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)'
      }
    : MENU_STYLES;

  return (
    <>
      {/* Hamburger Menu Button - Only visible on mobile and when no modal is open */}
      <Button
        style={{
          ...HAMBURGER_BUTTON_STYLES,
          display: isMobile && !isMobileMenuOpen && !isModalOpen ? 'flex' : 'none'
        }}
        onClick={toggleMobileMenu}
        className="align-items-center justify-content-center"
      >
        <FiMenu color="#fff" size={20} />
      </Button>

      {/* Overlay for mobile menu */}
      {isMobile && isMobileMenuOpen && (
        <div
          style={OVERLAY_STYLES}
          onClick={closeMobileMenu}
        />
      )}

      {/* Side Menu */}
      <Container
        className="d-flex flex-column py-3"
        style={{
          ...menuStyle,
          borderRadius: isMobile ? 0 : borderRadius.md,
          paddingTop: isMobile ? "60px" : "24px"
        }}
      >
      <div className="text-center mb-3">
        <div 
          className="bg-white rounded-circle mx-auto mb-3" 
          style={{ 
            width: isMobile ? "60px" : "80px", 
            height: isMobile ? "60px" : "80px", 
            padding: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Image
            src="/images/logo.png"
            alt="AugmentED Logo"
            style={{ 
              width: "100%", 
              height: "100%", 
              objectFit: "contain",
              padding: "2px"
            }}
          />
        </div>
        <h2 className="text-white mb-0" style={{ 
          fontSize: isMobile ? "1.2rem" : "1.5rem", 
          fontWeight: 600, 
          letterSpacing: "0.5px" 
        }}>ARquest</h2>
        <p className="text-white-50 small mb-0" style={{ 
          fontSize: isMobile ? "0.75rem" : "0.85rem",
          opacity: 0.7
        }}>Learning Reimagined</p>
      </div>

      <div className="px-3 mb-3">
        <div className="bg-white bg-opacity-10 rounded-pill px-3 py-2">
          <p className="text-white mb-0 text-center" style={{
            fontSize: isMobile ? "0.8rem" : "0.9rem",
            fontWeight: "500",
            opacity: 0.9
          }}>
            {localStorage.getItem('userName')}
          </p>
        </div>
      </div>      <ListGroup variant="flush" className="mt-2 flex-grow-0" style={{ border: "none" }}>        {userRole === 'admin' && (
          <>
            <DashboardListTile
              title="Admin"
              icon={<FiUser size={20} />}
              isSelected={selectedItem === "Admin"}
              onClick={() => handleNavigation("/admin")}
            />
            <DashboardListTile
              title="Statistics"
              icon={<FiBarChart2 size={20} />}
              isSelected={selectedItem === "Statistics"}
              onClick={() => handleNavigation("/statistics")}
            />
            <DashboardListTile
              title="Classroom"
              icon={<FiBook size={20} />}
              isSelected={selectedItem === "Classroom"}
              onClick={() => handleNavigation("/classroom")}
            />
          </>
        )}
        {userRole === 'teacher' && (
          <>
            <DashboardListTile
              title="Classroom"
              icon={<FiBook size={20} />}
              isSelected={selectedItem === "Classroom"}
              onClick={() => handleNavigation("/classroom")}
            />
            <DashboardListTile
              title="Modules"
              icon={<FiGrid size={20} />}
              isSelected={selectedItem === "Modules"}
              onClick={() => handleNavigation("/modules")}
            />
            <DashboardListTile
              title="Statistics" 
              icon={<FiBarChart2 size={20} />}
              isSelected={selectedItem === "Statistics"}
              onClick={() => handleNavigation("/statistics")}
            />
          </>
        )}
        {userRole === 'parent' && (
          <>
            <DashboardListTile
              title="Module"
              icon={<FiGrid size={20} />}
              isSelected={selectedItem === "Module"}
              onClick={() => handleNavigation("/modules")}
            />
          </>
        )}
        {/* Progress tab removed for students */}
      </ListGroup>      <ListGroup variant="flush" className="mt-auto border-0" style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "16px", textAlign: "center" }}>
        <DashboardListTile
          title="Profile"
          icon={<FiUser size={20} />}
          isSelected={selectedItem === "Profile"}
          onClick={() => handleNavigation("/profile")}
        />
        <DashboardListTile
          title="Logout"
          icon={<FiLogOut size={20} />}
          isSelected={false}
          onClick={handleLogout}
        />
      </ListGroup>
    </Container>
      {/* Logout confirmation modal */}
      <Modal show={showLogoutModal} onHide={cancelLogout} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ marginBottom: 0 }}>Are you sure you want to log out? You'll need to sign in again to access your account.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={cancelLogout}>Cancel</Button>
          <Button variant="danger" onClick={confirmLogout}>Log out</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SideMenu;

/* Add some custom styles */
const styles = `
  @media (max-width: 991.98px) {
    .main-content {
      margin-left: 0 !important;
      width: 100% !important;
      padding-left: 20px !important;
      padding-top: 70px !important;
    }
  }
`;

// Inject styles into head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  if (!document.head.querySelector('style[data-component="sidemenu"]')) {
    styleSheet.setAttribute('data-component', 'sidemenu');
    document.head.appendChild(styleSheet);
  }
}
