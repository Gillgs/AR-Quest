import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/home.css";
import backgroundImage from "../assets/background.png";
import A from '../assets/A.png';
import B from '../assets/B.png';
import C from '../assets/C.png';
import D from '../assets/D.png';
import E from '../assets/E.png';
import F from '../assets/F.png';
import H from '../assets/H.png';
import Ellipse15 from '../assets/Ellipse 15.png';
import Ellipse20 from '../assets/Ellipse 20.png';
import Ellipse21 from '../assets/Ellipse 21.png';
import Ellipse22 from '../assets/Ellipse 22.png';
import Ellipse23 from '../assets/Ellipse 23.png';
import Ellipse24 from '../assets/Ellipse 24.png';
import Rectangle64 from '../assets/Rectangle 64.png';
import Rectangle66 from '../assets/Rectangle 66.png';
import Rectangle67 from '../assets/Rectangle 67.png';
import Rectangle68 from '../assets/Rectangle 68.png';
import Rectangle69 from '../assets/Rectangle 69.png';
import Star11 from '../assets/Star 11.png';
import Star14 from '../assets/Star 14.png';
import Aug4 from '../assets/AugmentED (2) 4.png';

// Configure Google Drive link for the APK. If you want to trigger a direct download
// set DRIVE_FILE_ID to the file's ID (example: the id part from
// https://drive.google.com/file/d/FILE_ID/view). If you prefer to open the
// Drive view page, use DRIVE_VIEW_URL.
const DRIVE_FILE_ID = "1T7q9A9ZTWYj4OAZ9hLasCXQRfzM16h3N"; // file id from your Drive view link
const DRIVE_DIRECT_URL = `https://drive.google.com/uc?export=download&id=${DRIVE_FILE_ID}`;
// Fallback/view URL (opens Drive file view)
const DRIVE_VIEW_URL = "https://drive.google.com/file/d/1Rm5V9xAihB2KWGeRd48cDNqNk5Spgg32/view?usp=sharing";

const AugmentED = () => {
  return (
    <div className="container-fluid p-0">
      <div className="position-relative">
        <img
          src={backgroundImage}
          className="background-image"
          alt="Background"
        />
        <div className="container">
          {/* Navigation */}
          <nav className="navbar row">
            <div className="col-md-6">
              <a className="navbar-brand" href="#">
                <img
                  src="/images/logo.png"
                  height="50"
                  alt="Logo"
                />
              </a>
            </div>
            <div className="col-md-6">
              <div className="navbar-nav">
                <a href="#about" className="nav-link">About Us</a>
                <a href="#contact" className="nav-link" style={{ color: "#fff" }}>Contact</a>
                <Link to="/login" className="nav-link">Login</Link>
              </div>
            </div>
          </nav>

          {/* Hero Section */}
          <section className="section hero" id="hero">
            {/* Decorative PNGs */}
            <img src={A} alt="" className="hero-decor-A" />
            <img src={B} alt="" className="hero-decor-B" />
            <img src={C} alt="" className="hero-decor-C" />
            <img src={D} alt="" className="hero-decor-D" />
            <img src={E} alt="" className="hero-decor-E" />
            <img src={F} alt="" className="hero-decor-F" />
            <img src={H} alt="" className="hero-decor-H" />
            <img src={Ellipse15} alt="" className="hero-decor-Ell15" />
            <img src={Ellipse20} alt="" className="hero-decor-Ell20" />
            <img src={Ellipse22} alt="" className="hero-decor-Ell22" />
            <img src={Ellipse23} alt="" className="hero-decor-Ell23" />
            <img src={Ellipse24} alt="" className="hero-decor-Ell24" />
            <img src={Rectangle64} alt="" className="hero-decor-Rect64" />
            <img src={Rectangle66} alt="" className="hero-decor-Rect66" />
            <img src={Rectangle67} alt="" className="hero-decor-Rect67" />
            <img src={Rectangle68} alt="" className="hero-decor-Rect68" />
            <img src={Rectangle69} alt="" className="hero-decor-Rect69" />
            <img src={Star11} alt="" className="hero-decor-Star11" />
            <img src={Star14} alt="" className="hero-decor-Star14" />
            <img src={Aug4} alt="" className="hero-decor-Aug4" />
            <div className="row">
              <div className="col-half text-center">
                <h1 className="display-1" style={{ color: '#fff', fontSize: '5.5rem', fontWeight: 'bold' }}>ARquest</h1>
                <p className="lead mb-4" style={{ color: '#fff', fontWeight: 'normal' }}>Your future is just a click away Explore, Discover, and Learn!</p>
                <Link
                  to="/explore"
                  className="btn btn-primary"
                >
                  Explore
                </Link>
              </div>
              <div className="col-half">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/a0f3cc1678c745f9a0f13c500aec76ed/a0a403980b72b4ccbbef74bb613ae0621ef43f41?placeholderIfAbsent=true"
                  alt="Hero illustration"
                  className="img-fluid hero-image"
                />
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="section about" id="about">
            <div className="row">
              <div className="col-half">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/a0f3cc1678c745f9a0f13c500aec76ed/f0823635673df9cd9bf1541d019fc91df2b4d30e?placeholderIfAbsent=true"
                  alt="About illustration"
                  className="img-fluid"
                />
              </div>
              <div className="col-half text-center">
                <h2 className="section-title">About Us</h2>
                <p className="lead">
                  We envision a world where learning is no longer confined to
                  textbooks and screens. With ARventure, we aim to make
                  education more dynamic, accessible, and inspiring for
                  everyone, regardless of their background or experience level.
                </p>
              </div>
            </div>
          </section>

          {/* Apps Section */}
          <section className="section apps" id="apps">
            <div className="row">
              <div className="col-half">
                <h2 className="section-title">Meet Our Apps</h2>
                <div className="feature-item">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets/a0f3cc1678c745f9a0f13c500aec76ed/fb9cfb6c799a132c9bfff43dd2c2b0546a66619f?placeholderIfAbsent=true"
                    alt="Hands-on learning"
                    width="50"
                    className="feature-icon"
                  />
                  <span className="feature-text">Hands-On Learning</span>
                </div>
                <div className="feature-item">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets/a0f3cc1678c745f9a0f13c500aec76ed/a965b0707098f5aa9e8619f1156e4ad3f08990b6?placeholderIfAbsent=true"
                    alt="Fun application"
                    width="50"
                    className="feature-icon"
                  />
                  <span className="feature-text">Fun Application For Kids</span>
                </div>
                <div className="feature-item">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets/a0f3cc1678c745f9a0f13c500aec76ed/66d5141476e20741260bb3ac7633cc2629bed9c0?placeholderIfAbsent=true"
                    alt="Friendly interface"
                    width="50"
                    className="feature-icon"
                  />
                  <span className="feature-text">Friendly Interface</span>
                </div>
              </div>
              <div className="col-half">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/a0f3cc1678c745f9a0f13c500aec76ed/15c81f141dcd39ab5e8b05bfd0a625de9d449c1b?placeholderIfAbsent=true"
                  alt="Apps showcase"
                  className="img-fluid app-showcase-img"
                />
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="section features" id="features">
            <h2 className="section-title center">Features</h2>

            <div className="cards-container">
              <div className="feature-card">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/a0f3cc1678c745f9a0f13c500aec76ed/977f389c0863ca915badefec252f0bc485b86bc1?placeholderIfAbsent=true"
                  alt="Interactive lesson"
                  className="card-img"
                />
                <div className="card-body">
                  <h3 className="card-title">Interactive Lesson</h3>
                </div>
              </div>
              <div className="feature-card">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/a0f3cc1678c745f9a0f13c500aec76ed/11eb137523ef6eab644342ddc58f2d7a202a5366?placeholderIfAbsent=true"
                  alt="AR and 3D Models"
                  className="card-img"
                />
                <div className="card-body">
                  <h3 className="card-title">AR and 3D Models</h3>
                </div>
              </div>
              <div className="feature-card">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/a0f3cc1678c745f9a0f13c500aec76ed/4e22e872d97e72a645b02d0cfb255f4633dc9afc?placeholderIfAbsent=true"
                  alt="Curriculum Guide"
                  className="card-img"
                />
                <div className="card-body">
                  <h3 className="card-title">Curriculum Guide</h3>
                </div>
              </div>
            </div>
          </section>

          {/* Download Section */}
          <section className="section download" id="download">
            <div className="row">
              <div className="col-half">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/a0f3cc1678c745f9a0f13c500aec76ed/6460af333d8fcc1bddd949471502fa204b6a5950?placeholderIfAbsent=true"
                  alt="Download app"
                  className="img-fluid download-img"
                />
              </div>
              <div className="col-half text-center">
                <h2 className="section-title">
                  Download The App Today<br />
                  And Step Into The Future Of Education!
                </h2>
                {/* Visual button that triggers download of /app.apk */}
                <button
                  className="btn btn-download"
                  aria-label="Download APK"
                  onClick={() => {
                    // Use Google Drive direct download URL. Replace DRIVE_FILE_ID above with your file id.
                    // Prefer direct download if a real file id has been set
                    const driveUrl = DRIVE_FILE_ID && DRIVE_FILE_ID !== 'FILE_ID_PLACEHOLDER' ? DRIVE_DIRECT_URL : DRIVE_FOLDER_URL;
                    // Open in new tab to trigger download or fallback to creating anchor
                    try {
                      window.open(driveUrl, '_blank');
                    } catch (e) {
                      const link = document.createElement('a');
                      link.href = driveUrl;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                >
                  <span className="download-text">DOWNLOAD</span>
                  <div className="divider"></div>
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets/a0f3cc1678c745f9a0f13c500aec76ed/2ab8f98c093cfc08fec46bea65fa2f87abeabd01?placeholderIfAbsent=true"
                    alt="Download icon"
                    width="25"
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="footer" id="contact">
            <div className="row">
              <div className="col-half">
                <h2 className="section-title" style={{ color: "#000" }}>Contact</h2>
                <div className="footer-links mb-3">
                  <a href="#about" className="footer-link">ABOUT US</a>
                  <a href="#contact" className="footer-link">CONTACT</a>
                  <a href="mailto:augmented@arapp.com" className="footer-link">EMAIL</a>
                </div>
                <div className="contact-info">
                  <p className="text-muted mb-2">Email: augmented@arapp.com</p>
                  <p className="text-muted mb-0">Contact: +63 0910 1010 1010</p>
                </div>
              </div>
              <div className="col-half footer-right">
                <img
                  src="https://cdn.builder.io/api/v1/image/assets/a0f3cc1678c745f9a0f13c500aec76ed/b9dc7733b00a928fcadc80f76ccec596ecaeb701?placeholderIfAbsent=true"
                  alt="Contact illustration"
                  className="footer-img"
                />
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AugmentED;
