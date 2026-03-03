import { NavLink, Link } from "react-router-dom";
import '../styles/navbar.css';

const Navbar = () => {
    return (
        <header className="navbar-header">
            <Link to="/" className="logo">
                <h1>SoleSearch</h1>
            </Link>
            
            <nav className="nav-pill">
                <NavLink to="/mens" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Mens
                </NavLink>
                <NavLink to="/womens" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Womens
                </NavLink>
                <NavLink to="/kids" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Kids
                </NavLink>
                <NavLink to="/teens" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Teens
                </NavLink>
            </nav>
            <NavLink to="/login" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Log-in
            </NavLink>
        </header>
    );
};

export default Navbar;