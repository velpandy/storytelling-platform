import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfilePage.css";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate fetching user data (In real applications, fetch from API)
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/"); // Redirect to Home if not authenticated
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user"); // Remove user data from local storage
    navigate("/"); // Redirect to Home after logout
  };

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <h1>Welcome, {user ? user.username : "User"}</h1>
      </div>
      <div className="profile-content">
        <h3>Email: {user ? user.email : "Loading..."}</h3>
        <h3>Username: {user ? user.username : "Loading..."}</h3>
        
        <button
          onClick={() => navigate("/stories")}
          className="go-to-stories-button"
        >
          Go to Stories
        </button>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
