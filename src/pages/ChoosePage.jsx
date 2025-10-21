
import React, { useEffect, useState } from "react";
import animaImg from "../assets/anima.jpg";
import anima2Img from "../assets/anima2.jpg";
import starImg from "../assets/Star 11.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "../config/supabase";
import { useContext } from 'react';
import { SelectedChildContext } from '../contexts/SelectedChildContext';
import "../App.css";

// Animation styles
const floatAnim = {
  animation: "float 4s ease-in-out infinite alternate"
};
const bounceAnim = {
  transition: "transform 0.2s cubic-bezier(.68,-0.55,.27,1.55)",
};

// Add keyframes to document head if not present
if (typeof document !== 'undefined' && !document.getElementById('choosepage-anim')) {
  const style = document.createElement('style');
  style.id = 'choosepage-anim';
  style.innerHTML = `
    @keyframes float {
      0% { transform: translateY(0px); }
      100% { transform: translateY(-30px); }
    }
    @keyframes bounce {
      0% { transform: scale(1); }
      50% { transform: scale(1.08); }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

const colors = ["#6C3EB6", "#7ED6DF", "#55E36B", "#E74C3C", "#5D8BF4"];

export default function ChoosePage() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChildren = async () => {
      const parentId = localStorage.getItem("userId");
      const userRole = localStorage.getItem("userRole");
      
      if (!parentId) {
        setLoading(false);
        return;
      }
      
      if (userRole?.toLowerCase() !== 'parent') {
        setLoading(false);
        return;
      }
      
      
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, middle_name, last_name, student_id")
        .eq("parent_id", parentId);
        
      if (error) {
      } else {
        setChildren(data || []);
      }
      setLoading(false);
    };
    fetchChildren();
  }, []);

  const getFullName = (child) => {
    if (!child) return '';
    if (child.full_name && String(child.full_name).trim()) return String(child.full_name).trim();
    const parts = [child.first_name, child.middle_name, child.last_name].filter(Boolean).map(p => String(p).trim());
    return parts.join(' ');
  };

  const { setSelectedChild } = useContext(SelectedChildContext);

  const handleSelect = (childId, childName) => {
    // update shared context (which will sync to localStorage)
    if (setSelectedChild) setSelectedChild(String(childId), childName);
    navigate(`/modules?childId=${childId}`);
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #fff 80%, #e3f0ff 100%)",
      minHeight: "100vh",
      width: "100vw",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      color: "#111",
      overflow: "hidden"
    }}>
      {/* Floating shapes, letters, and animals */}
      <FloatingDecorations />
      <h1 style={{
        fontWeight: 700,
        fontSize: "2.8rem",
        marginBottom: "2.5rem",
        color: "#222",
        letterSpacing: "1px",
        textShadow: "0 2px 8px rgba(0,0,0,0.07)"
      }}>Who's Learning Today?  </h1>
      {loading ? (
        <div style={{ color: "#888" }}>Loading...</div>
      ) : (
        <div style={{
          display: "flex",
          gap: "2.5rem",
          marginBottom: "2.5rem",
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          {children.length === 0 ? (
            <>
              <div style={{ position: "absolute", bottom: 100, right: 60, width: 50, height: 50, borderRadius: 16, background: "#E74C3C", opacity: 0.28, filter: 'drop-shadow(0 2px 8px #E74C3C88)', ...floatAnim }} />
              <div style={{ position: "absolute", bottom: 200, left: 260, width: 45, height: 45, borderRadius: 16, background: "#6C3EB6", opacity: 0.24, filter: 'drop-shadow(0 2px 8px #6C3EB688)', ...floatAnim }} />
              <span style={{ color: "#888" }}>No children found.</span>
            </>
          ) : (
            children.map((child, idx) => (
              <div
                key={child.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  borderRadius: 36,
                  padding: "0.5rem 0.5rem 0 0.5rem",
                  ...bounceAnim
                }}
                onClick={() => handleSelect(child.id, `${child.first_name} ${child.last_name}`)}
                onMouseEnter={e => {
                  e.currentTarget.style.animation = "bounce 0.5s";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(44,62,80,0.13)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.animation = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{
                  width: 150,
                  height: 150,
                  borderRadius: 36,
                  background: colors[idx % colors.length],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 14,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
                  border: "3px solid #fff"
                }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.07)"
                  }} />
                </div>
                <span style={{
                  fontSize: "1.3rem",
                  color: "#222",
                  fontWeight: 500,
                  marginTop: 2,
                  letterSpacing: "0.5px",
                  textShadow: "0 1px 4px rgba(0,0,0,0.04)"
                }}>
                  {getFullName(child)}
                </span>
                <span style={{
                  fontSize: "1.05rem",
                  color: "#555",
                  marginTop: "2px",
                  fontWeight: 400,
                  letterSpacing: "0.2px"
                }}>
                  Student ID: {child.student_id ? child.student_id : `STU${String(idx + 1).padStart(3, '0')}`}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Floating shapes, letters, and animals component
function FloatingDecorations() {
  return (
    <>
      {/* Letters */}
  <span style={{ position: "absolute", top: 40, left: 60, fontSize: 80, color: "#E74C3C", opacity: 0.35, fontWeight: 900, fontFamily: 'Comic Sans MS, cursive, sans-serif', filter: 'drop-shadow(0 2px 8px #E74C3C88)', ...floatAnim }}>A</span>
  <span style={{ position: "absolute", top: 140, right: 100, fontSize: 70, color: "#6C3EB6", opacity: 0.32, fontWeight: 900, fontFamily: 'Comic Sans MS, cursive, sans-serif', filter: 'drop-shadow(0 2px 8px #6C3EB688)', ...floatAnim }}>B</span>
  <span style={{ position: "absolute", bottom: 120, left: 140, fontSize: 75, color: "#55E36B", opacity: 0.32, fontWeight: 900, fontFamily: 'Comic Sans MS, cursive, sans-serif', filter: 'drop-shadow(0 2px 8px #55E36B88)', ...floatAnim }}>C</span>
  <span style={{ position: "absolute", top: 60, right: 220, fontSize: 60, color: "#F7CA18", opacity: 0.30, fontWeight: 900, fontFamily: 'Comic Sans MS, cursive, sans-serif', filter: 'drop-shadow(0 2px 8px #F7CA1888)', ...floatAnim }}>D</span>
  {/* Shapes */}
  <div style={{ position: "absolute", top: 220, left: 30, width: 100, height: 100, borderRadius: "50%", background: "#7ED6DF", opacity: 0.22, filter: 'drop-shadow(0 2px 8px #7ED6DF88)', ...floatAnim }} />
  <div style={{ position: "absolute", bottom: 100, right: 60, width: 120, height: 120, borderRadius: 32, background: "#E74C3C", opacity: 0.20, filter: 'drop-shadow(0 2px 8px #E74C3C88)', ...floatAnim }} />
  <div style={{ position: "absolute", top: 320, right: 160, width: 80, height: 80, borderRadius: "50%", background: "#F7CA18", opacity: 0.20, filter: 'drop-shadow(0 2px 8px #F7CA1888)', ...floatAnim }} />
  <div style={{ position: "absolute", bottom: 200, left: 260, width: 110, height: 110, borderRadius: 32, background: "#6C3EB6", opacity: 0.18, filter: 'drop-shadow(0 2px 8px #6C3EB688)', ...floatAnim }} />
  {/* Star image */}
  <img src={starImg} alt="star" style={{ position: "absolute", top: 180, left: 420, width: 70, height: 70, opacity: 0.28, filter: 'drop-shadow(0 2px 8px #FFD70088)', ...floatAnim }} />
  <img src={starImg} alt="star" style={{ position: "absolute", bottom: 120, right: 320, width: 54, height: 54, opacity: 0.25, filter: 'drop-shadow(0 2px 8px #5500ff88)', ...floatAnim }} />
    </>
  );
}
