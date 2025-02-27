import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <nav className="navbar">
      <div className="logo-container">
        <Link to="/" className="logo">Kadhaipoma...</Link>
      </div>
      <div className={`nav-links ${isMenuOpen ? "mobile active" : ""}`}>
        <Link to="/" className="nav-link" onClick={() => setIsMenuOpen(false)}>Home</Link>
        <Link to="/collaborate" className="nav-link" onClick={() => setIsMenuOpen(false)}>Collaborate</Link>
        <Link to="/community" className="nav-link" onClick={() => setIsMenuOpen(false)}>Community</Link>
        <Link to="/stories" className="nav-link" onClick={() => setIsMenuOpen(false)}>Stories</Link>
      </div>
      <div className="hamburger" onClick={toggleMenu}>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </nav>
  );
};

export default Navbar;
