import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(true);
  const [letters, setLetters] = useState([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Check if user is already logged in
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/profile");
    }
  }, [navigate]);

  // Generate random floating letters
  useEffect(() => {
    const generateFloatingLetters = () => {
      const letterSet =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      const randomLetters = Array.from({ length: 30 }).map(() => ({
        letter: letterSet[Math.floor(Math.random() * letterSet.length)],
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 5 + 5,
      }));
      setLetters(randomLetters);
    };
    generateFloatingLetters();
  }, []);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const { data } = await axios.post("http://localhost:5000/api/login", {
        email,
        password,
      });
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/profile");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Login failed. Please try again.");
    }
  };

  // Handle signup
  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await axios.post("http://localhost:5000/api/signup", {
        username,
        email,
        password,
      });
      setSuccessMessage("Signup successful! You can now log in.");
      setShowLogin(true);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Signup failed. Please try again.");
    }
  };

  return (
    <div className="home-container">
      <div className="background-animation"></div>
      <div className="floating-letters">
        {letters.map((item, index) => (
          <span
            key={index}
            className="floating-letter"
            style={{
              top: `${item.y}vh`,
              left: `${item.x}vw`,
              animationDuration: `${item.duration}s`,
            }}
          >
            {item.letter}
          </span>
        ))}
      </div>
      <div className="content">
        <h1 className="title">Welcome to StoryCollab</h1>
        <p className="quote">"Unleash your imagination, one story at a time."</p>
        <div className="auth-section">
          <div className="auth-toggle">
            <button
              className={`toggle-button ${showLogin ? "active" : ""}`}
              onClick={() => setShowLogin(true)}
            >
              Login
            </button>
            <button
              className={`toggle-button ${!showLogin ? "active" : ""}`}
              onClick={() => setShowLogin(false)}
            >
              Signup
            </button>
          </div>
          {showLogin ? (
            <div className="auth-form">
              <h2>Login</h2>
              <form onSubmit={handleLogin}>
                <label htmlFor="email">Email:</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label htmlFor="password">Password:</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button className="cta-button" type="submit">
                  Login
                </button>
              </form>
              {errorMessage && <p className="error-message">{errorMessage}</p>}
            </div>
          ) : (
            <div className="auth-form">
              <h2>Signup</h2>
              <form onSubmit={handleSignup}>
                <label htmlFor="username">Username:</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <label htmlFor="email">Email:</label>
                <input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <label htmlFor="password">Password:</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button className="cta-button" type="submit">
                  Signup
                </button>
              </form>
              {errorMessage && <p className="error-message">{errorMessage}</p>}
              {successMessage && <p className="success-message">{successMessage}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
