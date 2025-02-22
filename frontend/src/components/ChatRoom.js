import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import './chatRoom.css'; // Import custom CSS for styling

const ChatRoom = () => {
  const { roomId } = useParams();
  const [roomDetails, setRoomDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [userId, setUserId] = useState(""); // Dynamic user ID
  const [username, setUsername] = useState(""); // Dynamic username
  const [displayName, setDisplayName] = useState("User");
  const [isUserInvited, setIsUserInvited] = useState(false);
  const [replyToMessageId, setReplyToMessageId] = useState(null); // To store the message ID being replied to
  const navigate = useNavigate();

  // Initialize user details from local storage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserId(user._id);
      setUsername(user.email);
      setDisplayName(user.email); // Default display name to email
    }
  }, []);

  // Fetch room details, messages, and check user invitation
  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/rooms/${roomId}`);
        setRoomDetails(response.data);
      } catch (error) {
        console.error("Error fetching room details:", error);
      }
    };

    const fetchMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/rooms/${roomId}/messages`);
        setMessages(response.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    const checkUserInvitation = async () => {
      try {
        const response = await axios.post(`http://localhost:5000/api/rooms/${roomId}/join`, {
          roomId,
          userId,
          username,
        });
        if (response.status === 200) {
          setIsUserInvited(true);
        }
      } catch (error) {
        console.error("User is not invited to this room:", error);
        navigate("/community"); // Redirect to community if not invited
      }
    };

    fetchRoomDetails();
    fetchMessages();
    if (userId) {
      checkUserInvitation();
    }
  }, [roomId, userId, username, navigate]);

  // Send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      try {
        await axios.post(`http://localhost:5000/api/rooms/${roomId}/messages`, {
          userId,
          username: displayName,
          content: newMessage,
        });
        setMessages([
          ...messages,
          { username: displayName, content: newMessage, createdAt: new Date() },
        ]);
        setNewMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  // Send a reply to a message
  const sendReply = async (e) => {
    e.preventDefault();
    if (replyMessage.trim() && replyToMessageId) {
      try {
        await axios.post(
          `http://localhost:5000/api/rooms/${roomId}/messages/${replyToMessageId}/reply`,
          {
            userId,
            username: displayName,
            content: replyMessage,
          }
        );
        // Refresh the messages after sending the reply
        const response = await axios.get(`http://localhost:5000/api/rooms/${roomId}/messages`);
        setMessages(response.data);
        setReplyMessage(""); // Clear reply input
        setReplyToMessageId(null); // Clear the message being replied to
      } catch (error) {
        console.error("Error sending reply:", error);
      }
    }
  };

  // Handle upvote/downvote actions
  const handleVote = async (messageId, type) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/rooms/${roomId}/messages/${messageId}/vote`, {
        vote: type,
      });
      if (response.status === 200) {
        // Update the message votes in the state (upvote or downvote)
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg._id === messageId
              ? { ...msg, upvotes: type === "upvote" ? msg.upvotes + 1 : msg.upvotes, downvotes: type === "downvote" ? msg.downvotes + 1 : msg.downvotes }
              : msg
          )
        );
      }
    } catch (error) {
      console.error(`Error ${type} message ${messageId}:`, error);
    }
  };

  // Start replying to a specific message
  const startReplying = (messageId) => {
    setReplyToMessageId(messageId);
  };

  return (
    <div className="chatroom-container">
      {roomDetails ? (
        <>
          <h1>{roomDetails.name}</h1>
          <p>{roomDetails.description}</p>

          {/* Messages Section */}
          <div className="messages-container">
            {messages.map((msg) => (
              <div className="message" key={msg._id}>
                <div className="message-bubble">
                  <strong>{msg.username}</strong>: {msg.content}
                </div>
                <div className="votes">
                  <button
                    className="vote-btn upvote"
                    onClick={() => handleVote(msg._id, "upvote")}
                  >
                    Upvote ({msg.upvotes})
                  </button>
                  <button
                    className="vote-btn downvote"
                    onClick={() => handleVote(msg._id, "downvote")}
                  >
                    Downvote ({msg.downvotes})
                  </button>
                </div>
                <div className="reply-btn">
                  <button onClick={() => startReplying(msg._id)}>Reply</button>
                </div>

                {/* Display replies to the message */}
                {msg.replies && msg.replies.length > 0 && (
                  <div className="replies-container">
                    {msg.replies.map((reply, index) => (
                      <div className="reply" key={index}>
                        <strong>{reply.username}</strong>: {reply.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* New Message Form - Only visible when not replying */}
          {isUserInvited && !replyToMessageId && (
            <form onSubmit={sendMessage} className="message-form">
              <textarea
                placeholder="Write a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                required
              />
              <button type="submit">Send</button>
            </form>
          )}

          {/* Reply Message Form - Only visible when replying */}
          {replyToMessageId && (
            <form onSubmit={sendReply} className="reply-form">
              <textarea
                placeholder="Write a reply..."
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                required
              />
              <button type="submit">Reply</button>
            </form>
          )}
        </>
      ) : (
        <p>Loading room details...</p>
      )}
    </div>
  );
};

export default ChatRoom;
