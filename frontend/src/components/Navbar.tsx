import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={{ padding: "10px", backgroundColor: "#f2f2f2" }}>
      <Link to="/" style={{ marginRight: "15px" }}>
        Login
      </Link>
      <Link to="/home" style={{ marginRight: "15px" }}>
        Home
      </Link>
      <Link to="/announcement">Announcement</Link>
    </nav>
  );
}

export default Navbar;
