import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Stories.css";

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
      setFilteredStories(stories.filter(story => story.genre === event.target.value));
    }
  };

  // Handle story click
  const handleClick = (storyId) => {
    if (authenticated) {
      navigate(`/stories/${storyId}/editor`);
    } else {
      alert("You need to log in to edit or comment on this story.");
    }
  };

  return (
    <div className="stories-container">
      <h1 className="stories-title">Stories</h1>
      <div className="genre-filter">
        <label htmlFor="genre-select" className="genre-label">Filter by Genre:</label>
        <select 
          id="genre-select" 
          value={selectedGenre} 
          onChange={handleGenreChange} 
          className="genre-select"
        >
          <option value="All">All</option>
          {genres.map((genre, index) => (
            <option key={index} value={genre}>{genre}</option>
          ))}
        </select>
      </div>

      <div className="stories-grid">
        {filteredStories.map((story) => (
          <div
            key={story.id}
            onClick={() => handleClick(story.id)}
            className="story-card"
          >
            <h2 className="story-title">{story.title}</h2>
            <p className="story-description">{story.description}</p>
            <p className="story-genre"><strong>Genre:</strong> {story.genre}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stories;
