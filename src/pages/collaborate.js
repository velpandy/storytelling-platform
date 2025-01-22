import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import './collaborate.css';
import '@fortawesome/fontawesome-free/css/all.css';
const socket = io("http://localhost:5000"); // Update to match your backend server

const Collaborate = () => {
  const [stories, setStories] = useState([]);
  const [story, setStory] = useState({ name: "", description: "", isPublic: true });
  const [currentStoryId, setCurrentStoryId] = useState(null);
  const [currentContent, setCurrentContent] = useState("");
  const [versionHistory, setVersionHistory] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [votes, setVotes] = useState({ up: 0, down: 0 });
  const [pendingRequests, setPendingRequests] = useState([]);

  // Fetch stories on component mount
  useEffect(() => {
    fetch("http://localhost:5000/collaborate/stories")
      .then((res) => res.json())
      .then((data) => setStories(data));
  }, []);

  // Handle story creation
  const handleStoryCreation = async () => {
    if (!story.name.trim() || story.name.length < 3) {
      alert("Story name must be at least 3 characters long.");
      return;
    }
    if (!story.description.trim() || story.description.length < 10) {
      alert("Story description must be at least 10 characters long.");
      return;
    }
  
    const response = await fetch("http://localhost:5000/collaborate/stories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...story,
        creatorId: JSON.parse(localStorage.getItem("user"))._id, // Add creator ID
      }),
    });
  
    const newStory = await response.json();
  
    if (response) {
      setStories([...stories, newStory]);
      alert("Story created successfully!");
    } else {
      alert(`Error creating story: ${newStory.error}`);
    }
  };
  

  // Handle selecting a story for collaboration
  const selectStory = async (storyId) => {
    // Reset the current content and version history before fetching new story data
    setCurrentStoryId(storyId);
    setCurrentContent(""); // Clear previous content
    setVersionHistory([]); // Clear previous version history
    setCollaborators([]); // Clear previous collaborators
    setVotes({ up: 0, down: 0 }); // Reset votes
  
    // Fetch the story's versions
    const versions = await fetch(`http://localhost:5000/collaborate/versions/${storyId}`).then((res) =>
      res.json()
    );
    if (versions.length > 0) {
      setCurrentContent(versions[versions.length - 1].content); // Set the latest version's content
      setVersionHistory(versions); // Set version history
    }
  
    // Fetch collaborators
    const story = stories.find((s) => s._id === storyId);
    if (story) {
      setCollaborators(story.collaborators || []);
    }
  
    // Fetch votes
    const votesData = await fetch(`http://localhost:5000/collaborate/votes/${storyId}`).then((res) =>
      res.json()
    );
    setVotes(votesData);
  
    // Join the socket room for the selected story
    socket.emit("joinStory", storyId);
  };
  

  // Handle real-time collaboration
  useEffect(() => {
    socket.on("updateContent", (updatedContent) => setCurrentContent(updatedContent));
    return () => socket.off("updateContent");
  }, []);



  const handleContentChange = (e) => {
    setCurrentContent(e.target.value);
    socket.emit("updateContent", { storyId: currentStoryId, content: e.target.value });
  };
  
  const userId = JSON.parse(localStorage.getItem("user"))._id;
  // Save the current version
const saveVersion = async () => {
  const response = await fetch("http://localhost:5000/collaborate/versions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      storyId: currentStoryId,
      content: currentContent,
      userId: userId,
    }),
  });

  const savedVersion = await response.json();

  if (response.ok) {
    setVersionHistory((prevHistory) => [...prevHistory, savedVersion]); // Add to versionHistory
  } else {
    console.error("Failed to save version:", savedVersion.error);
  }
};


  // Handle voting
  const handleVote = async (direction) => {
    await fetch("http://localhost:5000/collaborate/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storyId: currentStoryId,
        userId: userId, // Replace with actual user ID
        vote: direction,
      }),
    });

    setVotes((prevVotes) => ({
      ...prevVotes,
      [direction]: prevVotes[direction] + 1,
    }));
  };

  return (
    <div className="container">
      <h1>Collaborative Storytelling</h1>
  
      {/* Story Creation Section */}
      <div className="section">
        <h2>Create a New Story</h2>
        <input
          type="text"
          placeholder="Story Name"
          value={story.name}
          onChange={(e) => setStory({ ...story, name: e.target.value })}
        />
        <textarea
          placeholder="Story Description"
          value={story.description}
          onChange={(e) => setStory({ ...story, description: e.target.value })}
        />
        <select
          value={story.isPublic}
          onChange={(e) => setStory({ ...story, isPublic: e.target.value === "true" })}
        >
          <option value="true">Public</option>
          <option value="false">Private</option>
        </select>
        <button onClick={handleStoryCreation}>Create Story</button>
      </div>
  
      {/* Story Selection Section */}
      <div className="section">
        <h2>Select a Story</h2>
            <ul>
              {stories.map((s) => (
                <li key={s._id} onClick={() => selectStory(s._id)} className="story-item">
                  {/* Story Name */}
                  <strong>{s.name}</strong> - {s.description}

                  {/* Icon to denote public/private */}
                  <span className="story-icon">
                    {s.isPublic ? (
                      <i className="fas fa-globe" title="Public Story"></i> // Public icon
                    ) : (
                      <i className="fas fa-lock" title="Private Story"></i> // Private icon
                    )}
                  </span>
                </li>
              ))}
            </ul>
    </div>

  
      {/* Collaboration Section */}
      {currentStoryId && (
        <div className="section">
          <h2>Collaborate on {stories.find((s) => s._id === currentStoryId)?.name}</h2>
          <textarea
            value={currentContent}
            onChange={handleContentChange}
            placeholder="Edit story..."
          />
          <button onClick={saveVersion}>Save Version</button>
  
          {/* Version History */}
          <div className="version-history">
            <h3>Version History</h3>
            <ul>
              {versionHistory.map((version, index) => (
                <li key={version._id}>
                  <strong>Version {index + 1}:</strong> {version.content} <br />
                  <small>{new Date(version.timestamp).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          </div>
  
          {/* Voting */}
          <div>
            <h3>Vote</h3>
            <div className="vote-buttons">
              <button onClick={() => handleVote("up")}>Upvote</button>
              <button onClick={() => handleVote("down")}>Downvote</button>
            </div>
            <p>Upvotes: {votes.up || 0}</p>
            <p>Downvotes: {votes.down || 0}</p>
          </div>
        </div>
      )}
    </div>
  );
  
};

export default Collaborate;
