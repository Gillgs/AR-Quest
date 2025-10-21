import React from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import backgroundImage from "../assets/background.png";  // Using the background.png from assets
import anima1Image from "../assets/anima1.jpg";
import animaImage from "../assets/anima.jpg";
import anima2Image from "../assets/anima2.jpg";
import phFlag from "../assets/ph-flag.svg"; // Philippine flag

const ExplorePage = () => {
  return (
    <div className="container-fluid p-0">
      <div className="position-relative" style={{ 
        background: `linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.8)), url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
      }}>
        {/* Decorative elements for kid-friendly design */}
        <div className="position-absolute" style={{ top: '5%', left: '2%', zIndex: 0, fontSize: '3rem' }}>🌈</div>
        <div className="position-absolute" style={{ top: '10%', right: '5%', zIndex: 0, fontSize: '3rem' }}>🚀</div>
        <div className="position-absolute" style={{ bottom: '20%', left: '5%', zIndex: 0, fontSize: '2.5rem' }}>📚</div>
        <div className="position-absolute" style={{ bottom: '15%', right: '3%', zIndex: 0, fontSize: '2.5rem' }}>🔍</div>
        <div className="position-absolute" style={{ top: '50%', left: '3%', zIndex: 0, fontSize: '2.5rem' }}>🎨</div>
        <div className="position-absolute" style={{ top: '40%', right: '2%', zIndex: 0, fontSize: '2.5rem' }}>🧩</div>
        
        <div className="container position-relative" style={{ zIndex: 1 }}>
          {/* Navigation */}
          <nav className="navbar row">            <div className="col-md-12">
              <Link className="navbar-brand" to="/">
                <img
                  src="/images/logo.png"
                  height="50"
                  alt="Logo"
                />
              </Link>
            </div>
          </nav>

          {/* Hero Section - More narrative-focused without buttons */}
          <div className="text-center py-5 mb-4">
            <h1 className="display-4 fw-bold" style={{ color: "#FF6B6B" }}>
              <span role="img" aria-label="rocket">🚀</span> Discover Learning Adventures! <span role="img" aria-label="stars">✨</span>
            </h1>
            <p className="lead" style={{ color: "#4A6FA5", fontSize: "1.3rem" }}>
              Welcome, young explorers! Scroll down to discover wonderful worlds of learning waiting for you!
            </p>
          </div>

          {/* Subject Categories - Redesigned as discovery zones without buttons */}
          <section className="section subjects py-4" style={{ backgroundColor: "#FFF1E6", borderRadius: "25px", padding: "30px", marginBottom: "40px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
            <h2 className="section-title text-center mb-5" style={{ color: "#3D405B", fontWeight: "bold" }}>
              <span role="img" aria-label="magnifying glass">🔍</span> Explore Exciting Subjects <span role="img" aria-label="books">📚</span>
            </h2>
            
            <div className="text-center mb-4" style={{ fontStyle: "italic", color: "#5F6C7B" }}>
              <p>Each subject below has special treasures of knowledge waiting to be discovered...</p>
            </div>
            
            <div className="row mb-4">
              <div className="col-md-4 mb-4">
                <div className="card h-100 border-0" style={{ borderRadius: "18px", backgroundColor: "#E3F2FD", boxShadow: "0 6px 10px rgba(0,0,0,0.08)", transition: "transform 0.3s" }}>
                  <div className="card-body text-center p-4">
                    <div className="subject-icon mb-3">
                      <span role="img" aria-label="language" style={{ fontSize: "50px" }}>📝</span>
                    </div>
                    <h5 className="card-title fw-bold" style={{ color: "#3D405B" }}>Language</h5>
                    <p className="card-text">
                      Explore reading, writing, and communication skills! Learn vocabulary, grammar, and storytelling
                      in fun ways. Practice speaking clearly, writing creatively, and understanding different types
                      of texts from stories to poems.
                    </p>
                    <p className="mt-2 text-muted fst-italic">
                      <small style={{ color: "#000" }}>Words are the keys that unlock imagination!</small>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4 mb-4">
                <div className="card h-100 border-0" style={{ borderRadius: "18px", backgroundColor: "#FFF3CD", boxShadow: "0 6px 10px rgba(0,0,0,0.08)", transition: "transform 0.3s" }}>
                  <div className="card-body text-center p-4">
                    <div className="subject-icon mb-3">
                      <span role="img" aria-label="math" style={{ fontSize: "50px" }}>🔢</span>
                    </div>
                    <h5 className="card-title fw-bold" style={{ color: "#3D405B" }}>Math</h5>
                    <p className="card-text">
                      Discover the world of numbers, shapes, and patterns! Learn addition, subtraction, multiplication,
                      and division through interactive activities. Solve puzzles, measure objects, understand fractions,
                      and explore basic geometry.
                    </p>
                    <p className="mt-2 text-muted fst-italic">
                      <small style={{ color: "#000" }}>Numbers are everywhere in our daily lives!</small>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4 mb-4">
                <div className="card h-100 border-0" style={{ borderRadius: "18px", backgroundColor: "#D1E7DD", boxShadow: "0 6px 10px rgba(0,0,0,0.08)", transition: "transform 0.3s" }}>
                  <div className="card-body text-center p-4">
                    <div className="subject-icon mb-3">
                      <span role="img" aria-label="handshake" style={{ fontSize: "50px" }}>🤝</span>
                    </div>
                    <h5 className="card-title fw-bold" style={{ color: "#3D405B" }}>GMRC</h5>
                    <p className="card-text">
                      Learn Good Manners and Right Conduct! Discover the importance of respect, honesty, kindness,
                      and responsibility. Explore scenarios that teach proper behavior at home, in school, 
                      and in your community through stories and activities.
                    </p>
                    <p className="mt-2 text-muted fst-italic">
                      <small style={{ color: "#000" }}>Being kind and respectful makes the world better!</small>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mb-4">              <div className="col-md-6 mb-4">                <div className="card h-100 border-0" style={{ borderRadius: "18px", backgroundColor: "#FFE8D6", boxShadow: "0 6px 10px rgba(0,0,0,0.08)", transition: "transform 0.3s" }}>
                  <div className="card-body text-center p-4">                    <div className="subject-icon mb-3">
                      <span style={{ fontSize: "50px", display: "inline-block" }}>
                        <img src={phFlag} alt="Philippine flag" style={{ height: "50px", width: "50px", display: "inline-block" }} />
                      </span>
                    </div>
                    <h5 className="card-title fw-bold" style={{ color: "#3D405B" }}>Makabansa</h5>
                    <p className="card-text">
                      Explore Filipino history, culture, and civic awareness! Learn about national heroes, important 
                      historical events, cultural traditions, and local geography. Discover how government works and
                      the importance of being a good citizen in our country.
                    </p>
                    <p className="mt-2 text-muted fst-italic">
                      <small style={{ color: "#000" }}>Understanding our heritage makes us proud Filipinos!</small>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6 mb-4">
                <div className="card h-100 border-0" style={{ borderRadius: "18px", backgroundColor: "#D8F3DC", boxShadow: "0 6px 10px rgba(0,0,0,0.08)", transition: "transform 0.3s" }}>
                  <div className="card-body text-center p-4">
                    <div className="subject-icon mb-3">
                      <span role="img" aria-label="earth" style={{ fontSize: "50px" }}>🌎</span>
                    </div>
                    <h5 className="card-title fw-bold" style={{ color: "#3D405B" }}>Physical & Natural Environment</h5>
                    <p className="card-text">
                      Investigate plants, animals, and our planet's systems! Study different ecosystems, the water cycle,
                      weather patterns, and basic physics concepts. Learn about environmental conservation and how 
                      living things depend on each other for survival.
                    </p>
                    <p className="mt-2 text-muted fst-italic">
                      <small style={{ color: "#000" }}>Science helps us understand and protect our world!</small>
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </section>

          {/* Features Section - Redesigned as a narrative journey */}
          <section className="section features py-4" style={{ backgroundColor: "#EFF7FF", borderRadius: "25px", padding: "30px", marginBottom: "40px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
            <h2 className="section-title text-center mb-5" style={{ color: "#3D405B", fontWeight: "bold" }}>
              <span role="img" aria-label="sparkle">💫</span> Amazing Learning Features <span role="img" aria-label="sparkle">💫</span>
            </h2>
            
            <div className="text-center mb-4" style={{ fontStyle: "italic", color: "#5F6C7B" }}>
              <p>Here are the special tools that will help you on your learning adventure!</p>
            </div>
            
            <div className="row mb-5">
              {/* First Feature - AR Learning Experience */}
              <div className="col-md-4 mb-4">
                <div className="card border-0" style={{ borderRadius: "18px", backgroundColor: "white", boxShadow: "0 6px 10px rgba(0,0,0,0.08)", height: "500px" }}>
                  <div style={{ height: "200px", overflow: "hidden" }}>
                    <img
                      src={anima1Image}
                      className="card-img-top rounded-top w-100 h-100"
                      style={{ objectFit: "cover" }}
                      alt="AR Learning App"
                    />
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold" style={{ color: "#3D405B" }}>
                      <span role="img" aria-label="magic">✨</span> AR Learning Experience
                    </h5>
                    <p className="card-text flex-grow-1">
                      This special technology makes learning come alive in 3D! Point your device at the pages of your adventure books 
                      and watch as characters jump out to greet you, animals roam across your desk, and science 
                      experiments happen right before your eyes!
                    </p>
                    <p className="mt-2 text-muted fst-italic">
                      <small>It's like having tiny worlds hidden in every page.</small>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Second Feature - Fun Game-Based Learning */}
              <div className="col-md-4 mb-4">
                <div className="card border-0" style={{ borderRadius: "18px", backgroundColor: "white", boxShadow: "0 6px 10px rgba(0,0,0,0.08)", height: "500px" }}>
                  <div style={{ height: "200px", overflow: "hidden" }}>
                    <img
                      src={animaImage}
                      className="card-img-top rounded-top w-100 h-100"
                      style={{ objectFit: "cover" }}
                      alt="Interactive Lessons"
                    />
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold" style={{ color: "#3D405B" }}>
                      <span role="img" aria-label="game">🎮</span> Fun Game-Based Learning
                    </h5>
                    <p className="card-text flex-grow-1">
                      Fun challenges that make learning feel like a game! Solve puzzles to unlock new paths, 
                      collect golden stars as you answer questions correctly, and earn special badges 
                      that show what skills you've mastered on your journey.
                    </p>
                    <p className="mt-2 text-muted fst-italic">
                      <small>Each challenge completed makes you wiser!</small>
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Third Feature - Adventure Progress Tracker */}
              <div className="col-md-4 mb-4">
                <div className="card border-0" style={{ borderRadius: "18px", backgroundColor: "white", boxShadow: "0 6px 10px rgba(0,0,0,0.08)", height: "500px" }}>
                  <div style={{ height: "200px", overflow: "hidden" }}>
                    <img
                      src={anima2Image}
                      className="card-img-top rounded-top w-100 h-100"
                      style={{ objectFit: "cover" }}
                      alt="Progress Tracking"
                    />
                  </div>
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold" style={{ color: "#3D405B" }}>
                      <span role="img" aria-label="chart">📊</span> Adventure Progress Tracker
                    </h5>
                    <p className="card-text flex-grow-1">
                      Your magical tracker shows all the places you've visited and discoveries you've made! 
                      Watch new paths appear as you learn more, see your collection of badges grow, 
                      and keep track of all the knowledge treasures you've found along the way.
                    </p>
                    <p className="mt-2 text-muted fst-italic">
                      <small>Every explorer likes to see how far they've traveled!</small>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Storytelling element replacing download section */}
            <div className="story-section text-center mt-5" style={{ backgroundColor: "#FFE5D9", padding: "25px", borderRadius: "15px" }}>
              <h3 style={{ color: "#3D405B" }}>
                <span role="img" aria-label="book">📖</span> The Journey Begins...
              </h3>
              <p className="lead py-3" style={{ fontStyle: "italic", maxWidth: "800px", margin: "0 auto" }}>
                "Once upon a time, there was a curious young explorer just like you. They discovered this magical
                learning map and began an adventure that filled their mind with wonderful knowledge and their heart
                with joy. What amazing discoveries will YOU make on your learning journey?"
              </p>
              <div className="mt-3">
                <span role="img" aria-label="sparkle" style={{ fontSize: "1.8rem", color: "#FF9F1C" }}>✨</span>
              </div>
            </div>
          </section>          {/* Footer */}
          <footer className="footer mt-5" id="contact" style={{ borderRadius: "15px", backgroundColor: "#F8EDEB", padding: "20px" }}>
            <div className="container">
              <div className="row">
                <div className="col-md-6">
                  <h2 className="section-title" style={{ color: "#3D405B" }}>
                    <span role="img" aria-label="wave">👋</span> Contact Us
                  </h2>
                  <div className="footer-links mb-3">
                    <a href="#about" className="footer-link me-3" style={{ color: "#000" }}>ABOUT US</a>
                    <a href="#contact" className="footer-link me-3" style={{ color: "#000" }}>CONTACT</a>
                    <a href="mailto:augmented@arapp.com" className="footer-link" style={{ color: "#000" }}>EMAIL</a>
                  </div>
                  <div className="contact-info">
                    <p className="mb-2" style={{ color: "#212529" }}>Email: augmented@arapp.com</p>
                    <p className="mb-0" style={{ color: "#212529" }}>Contact: +63 0910 1010 1010</p>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
