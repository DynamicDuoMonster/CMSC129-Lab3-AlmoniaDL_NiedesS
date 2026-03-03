import { NavLink, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import '../styles/navbar.css';

const Navbar = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

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

            {user ? (
                <div className="nav-account">
                    <NavLink to="/account" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                        {user.username}
                    </NavLink>
                    <button className="nav-item logout-btn" onClick={handleLogout}>
                        Log out
                    </button>
                </div>
            ) : (
                <NavLink to="/login" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Log in
                </NavLink>
            )}
        </header>
    );
};

export default Navbar;