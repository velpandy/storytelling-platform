import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const StoryEditor = () => {
  const { storyId } = useParams();
  const [story, setStory] = useState(null);
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [authenticated, setAuthenticated] = useState(true); // Simulating authentication state

  useEffect(() => {
    // Simulate fetching the story based on the storyId
    setStory({
      id: storyId,
      title: `Story ${storyId}`,
      content: `This is the content of story ${storyId}.`,
    });
  }, [storyId]);

  const handleCommentChange = (e) => {
    setComment(e.target.value);
  };

  const handleRatingChange = (e) => {
    setRating(e.target.value);
  };

  const handleSave = () => {
    if (authenticated) {
      alert("Changes saved successfully!");
    } else {
      alert("You need to be logged in to edit the story.");
    }
  };

  const handleCommentSubmit = () => {
    if (authenticated) {
      alert(`Comment: "${comment}" added successfully!`);
      setComment("");
    } else {
      alert("You need to be logged in to comment.");
    }
  };

  if (!story) {
    return <div>Loading story...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>{story.title}</h1>
      <div style={{ marginBottom: '20px' }}>
        <textarea
          value={story.content}
          disabled={!authenticated} // Disable content edit if not authenticated
          rows="10"
          cols="50"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '1rem',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        />
      </div>
      <div style={{ marginBottom: '20px' }}>
        {authenticated && (
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              fontSize: '1rem',
              cursor: 'pointer',
              border: 'none',
              borderRadius: '5px',
            }}
          >
            Save Changes
          </button>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Rate this Story</h3>
        <select
          value={rating}
          onChange={handleRatingChange}
          disabled={!authenticated}
          style={{
            padding: '10px',
            fontSize: '1rem',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        >
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
        {authenticated && (
          <button
            onClick={() => alert("Rating submitted!")}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              fontSize: '1rem',
              cursor: 'pointer',
              border: 'none',
              borderRadius: '5px',
              marginLeft: '10px',
            }}
          >
            Submit Rating
          </button>
        )}
      </div>

      <div>
        <h3>Leave a Comment</h3>
        <textarea
          value={comment}
          onChange={handleCommentChange}
          placeholder="Write a comment..."
          disabled={!authenticated}
          style={{
            width: '100%',
            padding: '10px',
            height: '100px',
            fontSize: '1rem',
            borderRadius: '5px',
            border: '1px solid #ddd',
          }}
        />
        {authenticated && (
          <button
            onClick={handleCommentSubmit}
            style={{
              padding: '10px 20px',
              backgroundColor: '#FFC107',
              color: 'white',
              fontSize: '1rem',
              cursor: 'pointer',
              border: 'none',
              borderRadius: '5px',
              marginTop: '10px',
            }}
          >
            Submit Comment
          </button>
        )}
      </div>
    </div>
  );
};

export default StoryEditor;
