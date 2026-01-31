import { NavLink } from "react-router-dom";
import "../styles/navbar.css";

export default function Navbar() {
  return (
    <div className="navWrap">
      <div className="navBar">
        <div className="brand">↗</div>

        <nav className="navLinks">
          <NavLink to="/" className={({isActive}) => isActive ? "active" : ""}>Home</NavLink>
          <NavLink to="/profile" className={({isActive}) => isActive ? "active" : ""}>Profile</NavLink>
          <NavLink to="/dashboard" className={({isActive}) => isActive ? "active" : ""}>Dashboard</NavLink>
          <NavLink to="/jobs" className={({isActive}) => isActive ? "active" : ""}>Jobs</NavLink>
        </nav>
      </div>
    </div>
  );
}
