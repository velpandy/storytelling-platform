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
  const [votes, setVotes] = useState({});
  const userId = JSON.parse(localStorage.getItem("user"))._id;

  // Fetch stories on component mount
  useEffect(() => {
    fetch("http://localhost:5000/collaborate/stories")
      .then((res) => res.json())
      .then((data) => setStories(data));
  }, []);

  useEffect(() => {
    socket.on("newStory", (newStory) => {
      setStories((prev) => [...prev, newStory]);
    });

    socket.on("updateVersion", (updatedVersion) => {
      setVersionHistory((prev) => [...prev, updatedVersion]);
      if (updatedVersion.storyId === currentStoryId) {
        setCurrentContent(updatedVersion.content);
      }
    });

    socket.on("updateVotes", ({ versionId, votes }) => {
      setVotes((prev) => ({ ...prev, [versionId]: votes }));
    });

    return () => {
      socket.off("newStory");
      socket.off("updateVersion");
      socket.off("updateVotes");
    };
  }, [currentStoryId]);

  useEffect(() => {
    socket.on("updateVotes", ({ versionId, votes }) => {
      setVotes((prev) => ({
        ...prev,
        [versionId]: votes,
      }));
    });
  
    return () => {
      socket.off("updateVotes");
    };
  }, []);
  

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
        creatorId: userId,
      }),
    });
  
    const newStory = await response.json();
  
    if (response) {
      // Emit the new story to other clients
      socket.emit("newStory", newStory);
  
      // Immediately update the stories list in the current frontend
      setStories((prevStories) => [...prevStories, newStory]);
      alert("Story created successfully!");
    } else {
      alert(`Error creating story: ${newStory.error}`);
    }
  };
  

  const selectStory = async (storyId) => {
    setCurrentStoryId(storyId);
    setCurrentContent("");
    setVersionHistory([]);
    setCollaborators([]);
    setVotes({});
  
    // Fetch versions for the selected story
    const versions = await fetch(`http://localhost:5000/collaborate/versions/${storyId}`).then((res) =>
      res.json()
    );
    if (versions.length > 0) {
      setCurrentContent(versions[versions.length - 1].content);
      setVersionHistory(versions);
    }
  
    const selectedStory = stories.find((s) => s._id === storyId);
    if (selectedStory) {
      setCollaborators(selectedStory.collaborators || []);
    }
  
    // Fetch votes for each version and set the votes state
    const votesData = {};
    for (const version of versions) {
      const versionVotes = await fetch(`http://localhost:5000/collaborate/votes/version/${version._id}`)
        .then((res) => res.json())
        .catch(() => ({ up: 0, down: 0 })); // Handle errors gracefully
      votesData[version._id] = versionVotes;
    }
    setVotes(votesData);
  
    // Join the story room for real-time updates
    socket.emit("joinStory", storyId);
  };
  

  const handleContentChange = (e) => {
    const updatedContent = e.target.value;
    setCurrentContent(updatedContent);
    socket.emit("updateContent", { storyId: currentStoryId, content: updatedContent });
  };

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
      // Emit the new version to other clients
      socket.emit("updateVersion", savedVersion);
  
      // Immediately update the version history in the current frontend
      setVersionHistory((prevVersions) => [...prevVersions, savedVersion]);
      alert("Version saved successfully!");
    } else {
      console.error("Failed to save version:", savedVersion.error);
    }
  };
  

  const revertToVersion = (versionContent) => {
    setCurrentContent(versionContent);
    socket.emit("updateContent", { storyId: currentStoryId, content: versionContent });
  };

  const handleVote = async (versionId, direction) => {
    try {
      await fetch("http://localhost:5000/collaborate/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId,
          userId,
          vote: direction,
        }),
      });
  
      // Fetch updated votes for the specific version from the backend
      const updatedVotes = await fetch(`http://localhost:5000/collaborate/votes/version/${versionId}`)
        .then((res) => res.json())
        .catch(() => ({ up: 0, down: 0 })); // Handle errors gracefully
  
      // Update the state for the specific version's votes
      setVotes((prev) => ({
        ...prev,
        [versionId]: updatedVotes,
      }));
  
      // Notify other clients of the updated votes
      socket.emit("updateVotes", { versionId, votes: updatedVotes });
    } catch (err) {
      console.error("Failed to submit vote:", err);
    }
  };
  
  

  return (
    <div className="container">
      <h1>Collaborative Storytelling</h1>

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

      <div className="section">
        <h2>Select a Story</h2>
        <ul>
          {stories.map((s) => (
            <li key={s._id} onClick={() => selectStory(s._id)} className="story-item">
              <strong>{s.name}</strong> - {s.description}
              <span className="story-icon">
                {s.isPublic ? (
                  <i className="fas fa-globe" title="Public Story"></i>
                ) : (
                  <i className="fas fa-lock" title="Private Story"></i>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {currentStoryId && (
        <div className="section">
          <h2>Collaborate on {stories.find((s) => s._id === currentStoryId)?.name}</h2>
          <textarea
            value={currentContent}
            onChange={handleContentChange}
            placeholder="Edit story..."
          />
          <button onClick={saveVersion}>Save Version</button>

          <div className="version-history">
            <h3>Version History</h3>
            <ul>
              {versionHistory.map((version) => (
                <li key={version._id}>
                  <strong>{version.content}</strong>
                  <small>{new Date(version.timestamp).toLocaleString()}</small>
                  <button onClick={() => revertToVersion(version.content)}>Revert</button>
                  <div>
                    <button onClick={() => handleVote(version._id, "up")}>Upvote</button>
                    <button onClick={() => handleVote(version._id, "down")}>Downvote</button>
                    <p>Upvotes: {votes[version._id]?.up || 0}</p>
                    <p>Downvotes: {votes[version._id]?.down || 0}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      )}
    </div>
  );
};

export default Collaborate;
