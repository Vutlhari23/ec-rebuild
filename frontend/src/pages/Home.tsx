import React from "react";
import "./Home.css";
import { Menu } from "antd";
import { Routes, Route } from "react-router-dom";

function Home() {
  return (
    <div>
      <Menu
        items={[
          { key: "home", label: "Home" },
          { key: "dashboard", label: "DashBoard" },
          { key: "users", label: "Users list" },
        ]}
        mode="horizontal"
      />
      <Content />
    </div>
  );
}

function Content() {
  return (
    <Routes>
      <Route path="/" element={<div>Home</div>} />
      <Route path="/dashboard" element={<div>DashBoard</div>} />
      <Route path="/userlist" element={<div>UserList</div>} />
      <Route path="/profile" element={<div>Profile</div>} />
    </Routes>
  );
}

export default Home;
