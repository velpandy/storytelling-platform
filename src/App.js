import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import StoryEditor from "./pages/StoryEditor";  // Updated import for StoryEditor
import Community from "./pages/Community";
import Stories from "./pages/Stories";
import Collaborate from "./pages/collaborate";
import ProfilePage from "./pages/ProfilePage"; // Import ProfilePage
import ChatRoom from "./components/ChatRoom";

const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stories/:storyId/editor" element={<StoryEditor />} />  {/* Updated StoryEditor route */}
        <Route path="/collaborate" element={<Collaborate />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/community" element={<Community />} />
        <Route path="/profile" element={<ProfilePage />} /> {/* Profile route */}
        <Route path="/chatRoom/:roomId" element={<ChatRoom />} />
      </Routes>
    </Router>
  );
};

export default App;
