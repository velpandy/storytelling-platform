import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import './Stories.css';
const Stories = () => {
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [genres, setGenres] = useState(["Fantasy", "Sci-Fi", "Mystery", "Romance"]);
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [authenticated, setAuthenticated] = useState(true); // Simulating authentication state

  // Fetch stories from the backend
  useEffect(() => {
    const fetchStories = async () => {
      try {
        const response = await axios.get("http://localhost:5000/collaborate/stories");
        const fetchedStories = response.data.map((story) => ({
          id: story._id,
          title: story.name,
          description: story.description,
          genre: genres.includes(story.genre) ? story.genre : "Unknown", // Fallback if genre is not listed
        }));
        setStories(fetchedStories);
        setFilteredStories(fetchedStories);
      } catch (error) {
        console.error("Error fetching stories:", error);
      }
    };
    fetchStories();
  }, [genres]);

  // Filter stories based on selected genre
  const handleGenreChange = (event) => {
    setSelectedGenre(event.target.value);
    if (event.target.value === "All") {
      setFilteredStories(stories);
    } else {
      setFilteredStories(stories.filter((story) => story.genre === event.target.value));
    }
  };

  // Handle story click
  const handleClick = (story) => {
    if (authenticated) {
      navigate(`/stories/${story.id}/editor`, { state: { story } });
    } else {
      alert("You need to log in to edit or comment on this story.");
    }
  };

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Stories</h1>
      <div style={{ marginBottom: "20px" }}>
        <label htmlFor="genre-select" style={{ fontSize: "1.2rem" }}>
          Filter by Genre:{" "}
        </label>
        <select
          id="genre-select"
          value={selectedGenre}
          onChange={handleGenreChange}
          style={{ padding: "10px", fontSize: "1rem", borderRadius: "5px" }}
        >
          <option value="All">All</option>
          {genres.map((genre, index) => (
            <option key={index} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px" }}>
        {filteredStories.map((story) => (
          <div
            key={story.id}
            onClick={() => handleClick(story)}
            style={{
              border: "1px solid #ddd",
              padding: "15px",
              borderRadius: "8px",
              cursor: "pointer",
              backgroundColor: "black",
              boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2>{story.title}</h2>
            <p>{story.description}</p>
            <p>
              <strong>Genre:</strong> {story.genre}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stories;