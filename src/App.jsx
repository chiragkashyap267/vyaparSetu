import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./assets/components/Login.jsx";
import Admin from "./assets/components/Admin.jsx";
import UserDashboard from "./assets/components/UserDashboard.jsx";

function App() {
  return (
  
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/dashboard" element={<UserDashboard />} />
      </Routes>
  
  );
}

export default App;
