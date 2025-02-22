import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import io from "socket.io-client";

// Replace with your backend URL
const socket = io("http://localhost:5000");

const StoryEditor = () => {
  const location = useLocation();
  const { story } = location.state; // Retrieve the story passed from the Stories component
  const [currentContent, setCurrentContent] = useState("");
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState(null);

  // Assuming that userId and userName are stored in a state or from authentication
  const userId = JSON.parse(localStorage.getItem("user"))._id;  // Replace with actual user ID (e.g., from session or authentication)
  const userName = JSON.parse(localStorage.getItem("user")).email;; // Replace with actual user name (e.g., from session or authentication)

  useEffect(() => {
    // Fetch the latest version of the selected story
    const fetchStoryContent = async () => {
      try {
        const versions = await fetch(`http://localhost:5000/collaborate/versions/${story.id}`).then((res) => res.json());
        if (versions.length > 0) {
          setCurrentContent(versions[versions.length - 1].content);
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

  // Render stars for rating
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
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
    ));
  };

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
          rating, // Include the rating in the submission
          userId, // Include the user ID
          userName, // Include the user name
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

      {/* Displaying the content of the story */}
      <div
        style={{
          width: "100%",
          height: "200px",
          marginBottom: "20px",
          padding: "10px",
          border: "1px solid #ddd",
          borderRadius: "5px",
          backgroundColor: "black",
          overflowY: "auto",
          whiteSpace: "pre-wrap",
          wordWrap: "break-word",
        }}
      >
        {currentContent || "No content available for this story."}
      </div>

      {/* Feedback form */}
      <form onSubmit={handleFeedbackSubmit} style={{ marginTop: "20px" }}>
        {/* Render stars for rating */}
        <div style={{ marginBottom: "10px" }}>
          {renderStars()}
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
