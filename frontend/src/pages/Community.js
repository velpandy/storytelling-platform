import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import './Community.css';



export const createRoom = async (roomName, roomDescription, invitedUsers) => {
  try {
    const response = await axios.post("http://localhost:5000/api/rooms", {
      name: roomName,
      description: roomDescription,
      creator: JSON.parse(localStorage.getItem("user")).email, // Replace with dynamic user ID
      invitedUsers, // Include invited users
    });
    return response.data; // Return the created room object
  } catch (error) {
    console.error("Error creating room:", error);
    throw error;
  }
};
const Community = () => {
  const [rooms, setRooms] = useState([]);
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const navigate = useNavigate();

  // Fetch all rooms
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/rooms");
        setRooms(response.data);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };
    fetchRooms();
  }, []);

  // Fetch available users to invite
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/rooms/available-users");
        setUsersList(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Create a new room
  const createRoom = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/rooms", {
        name: roomName,
        description: roomDescription,
        creator: JSON.parse(localStorage.getItem("user")).email, // Replace with dynamic user ID in the future
        invitedUsers, // Include invited users
      });
      setRooms([...rooms, { ...response.data }]);
      setRoomName("");
      setRoomDescription("");
      setInvitedUsers([]);
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  

  const toggleUserInvite = (userId) => {
    setInvitedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="community">
      <h1>Community</h1>

      {/* Room Creation Form */}
      <form onSubmit={createRoom}>
        <input
          type="text"
          placeholder="Room Name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          required
        />
        <textarea
          placeholder="Room Description"
          value={roomDescription}
          onChange={(e) => setRoomDescription(e.target.value)}
          required
        />
        
        {/* User Selection for Invitation */}
        <div className="user-selection">
          <h3>Select Users to Invite</h3>
          {usersList.map((user) => (
            <div key={user._id} className="user-item">
              <input
                type="checkbox"
                checked={invitedUsers.includes(user._id)}
                onChange={() => toggleUserInvite(user._id)}
              />
              <span>{user.username}</span>
            </div>
          ))}
        </div>
        
        <button type="submit">Create Room</button>
      </form>

      {/* Room List */}
      <h2>Available Rooms</h2>
      
      <ul>
        {rooms.map((room) => (
          <li key={room._id}>
            <h3>{room.name}</h3>
            <p>{room.description}</p>
            <button onClick={() => navigate(`/chatRoom/${room._id}`)}>Enter Room</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Community;
