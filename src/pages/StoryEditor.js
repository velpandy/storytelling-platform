import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import io from "socket.io-client";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Import the default Quill styles

const socket = io("http://localhost:5000");

const StoryEditor = () => {
  const location = useLocation();
  const { story } = location.state; // Retrieve the story passed from the Stories component
  const [currentContent, setCurrentContent] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);

  const userId = JSON.parse(localStorage.getItem("user"))._id;
  const userName = JSON.parse(localStorage.getItem("user")).email;

  useEffect(() => {
    // Fetch the most upvoted version of the selected story
    const fetchStoryContent = async () => {
      try {
        const version = await fetch(`http://localhost:5000/collaborate/versions/most-voted/${story.id}`)
          .then((res) => res.json());
        if (version && version.content) {
          setCurrentContent(version.content);
        }
      } catch (err) {
        console.error("Failed to fetch story content:", err);
      }
    };
  
    fetchStoryContent();
  
    socket.emit("joinStory", story.id); // Join the story room for real-time updates
  
    socket.on("updateVersion", (updatedVersion) => {
      if (updatedVersion.storyId === story.id) {
        setCurrentContent(updatedVersion.content);
      }
    });
  
    // Cleanup on component unmount
    return () => {
      socket.off("updateVersion");
    };
  }, [story.id]);
  

  // Handle feedback submission
  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus(null);

    try {
      const response = await fetch(`http://localhost:5000/feedback/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyId: story.id,
          content: feedback,
          rating,
          userId,
          userName,
        }),
      });

      if (response.ok) {
        setFeedback(""); // Clear the input field
        setRating(0); // Reset the rating
        setSubmissionStatus("Feedback submitted successfully!");
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (error) {
      setSubmissionStatus(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ marginTop: "30px" }}>
      <h1>Story: {story.title}</h1>

      {/* Displaying the content of the story in a read-only view */}
      <div
        style={{
          marginBottom: "20px",
          border: "1px solid #ddd",
          padding: "10px",
          borderRadius: "5px",
          backgroundColor: "#f9f9f9",
          maxWidth: "900px",
          margin: "0 auto",
          height: "auto",
        }}
      >
        <ReactQuill
          value={currentContent}
          readOnly={true} // Makes it view-only
          theme="snow"   // Uses the "snow" theme, which is simple and clean
          modules={{
            toolbar: false, // Disables the toolbar (bold, italic, etc.)
          }}
        />
      </div>

      {/* Feedback form */}
      <form onSubmit={handleFeedbackSubmit} style={{ marginTop: "20px" }}>
        <div style={{ marginBottom: "10px" }}>
          {/* Render stars for rating */}
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              style={{
                cursor: "pointer",
                fontSize: "24px",
                color: index < rating ? "#FFD700" : "#ccc", // Gold for selected, gray for unselected
              }}
              onClick={() => setRating(index + 1)}
            >
              ★
            </span>
          ))}
        </div>

        {/* Textarea for feedback */}
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Leave your feedback here..."
          rows="4"
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "5px",
            border: "1px solid #ddd",
            marginBottom: "10px",
          }}
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            padding: "10px 15px",
            borderRadius: "5px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
          }}
        >
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </button>
      </form>

      {/* Submission Status Message */}
      {submissionStatus && (
        <p
          style={{
            color: isSubmitting ? "blue" : "green",
            marginTop: "15px",
          }}
        >
          {submissionStatus}
        </p>
      )}
    </div>
  );
};

export default StoryEditor;
