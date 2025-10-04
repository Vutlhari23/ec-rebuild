import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";

import Home from "./pages/Home.tsx";
import Announcement from "./pages/Announcement.tsx";
import Login from "./pages/Login.tsx";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/announcement" element={<Announcement />} />
      </Routes>
    </Router>
  );
}

export default App;
