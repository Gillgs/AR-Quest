import React from "react";
import { ListGroup } from "react-bootstrap";
import { colors, shadows, fontWeights } from "../styles/constants";

const DashboardListTile = ({ title, icon, isSelected, onClick }) => {
  return (
    <ListGroup.Item
      action
      onClick={onClick}
      className={`d-flex align-items-center py-3 border-0 mb-2 ${isSelected ? 'active' : ''}`}
      style={{
        cursor: "pointer",
        backgroundColor: isSelected ? "rgba(255, 255, 255, 0.2)" : "transparent",
        borderRadius: "8px",
        transition: "all 0.2s ease",
        paddingLeft: "1.25rem",
        paddingRight: "1.25rem",
        position: "relative",
        outline: "none"
      }}
      onMouseOver={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseOut={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.transform = "translateY(0)";
        }
      }}
      onFocus={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
        }
      }}
      onBlur={(e) => {
        if (!isSelected) {
          e.currentTarget.style.backgroundColor = "transparent";
        }
      }}
    >
      {isSelected && (
        <div 
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: "4px",
            height: "60%",
            backgroundColor: "#ffffff",
            borderRadius: "0 4px 4px 0"
          }}
        />
      )}
      <div 
        className="me-3" 
        style={{ 
          color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.8)",
        }}
      >
        {icon}
      </div>
      <span 
        style={{ 
          color: isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.8)",
          fontWeight: isSelected ? fontWeights.medium : fontWeights.regular,
        }}
      >
        {title}
      </span>
    </ListGroup.Item>
  );
};

export default DashboardListTile;
