import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => (
  <nav style={navbarStyle}>
    <div style={logoContainerStyle}>
      <Link to="/" style={logoStyle}>StoryHub</Link>
    </div>
    <div style={navLinksStyle}>
      <Link to="/" style={linkStyle}>Home</Link>
      <Link to="/collaborate" style={linkStyle}>Collaborate</Link>
      <Link to="/community" style={linkStyle}>Community</Link>
      <Link to="/stories" style={linkStyle}>Stories</Link>
    </div>
  </nav>
);

// Style objects
const navbarStyle = {
  padding: "10px 20px",
  backgroundColor: "#4A90E2", // Blue background for a modern look
  color: "#fff",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  borderBottom: "2px solid #ddd", // Subtle border for separation
};

const logoContainerStyle = {
  flex: 1,
};

const logoStyle = {
  color: "#fff",
  fontSize: "1.8rem",
  fontWeight: "bold",
  textDecoration: "none",
};

const navLinksStyle = {
  display: "flex",
  gap: "20px",
};

const linkStyle = {
  color: "#fff", // White color for nav links
  fontSize: "1.2rem",
  textDecoration: "none",
  transition: "color 0.3s ease", // Smooth transition for hover effect
};

// Hover effect for links
const linkHoverStyle = {
  color: "##357ABD", // Yellow hover effect
};

export default Navbar;
