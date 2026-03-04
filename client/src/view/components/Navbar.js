import { NavLink, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import '../styles/navbar.css';

const Navbar = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [shoeName, setShoeName] = useState('');
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    const handleSearch = (e) => {
        const query = e.target.value;
        setShoeName(query);

        if (query.length > 0) {
            navigate(`/search?name=${query}`);
        } else {
            navigate('/');
        }
    };


    return (
        <header className="navbar-header">
            <Link to="/" className="logo">
                <h1>SoleSearch</h1>
            </Link>

            <nav className="nav-pill">
                <NavLink to="/Lifestyle" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Lifestyle
                </NavLink>
                <NavLink to="/Sports" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Sports
                </NavLink>
                <NavLink to="/Mens" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Mens
                </NavLink>
                <NavLink to="/Womens" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                    Womens
                </NavLink>
            </nav>

            <div className="nav-right">
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

                <input
                    type="text"
                    placeholder="Search shoes..."
                    value={shoeName}
                    onChange={handleSearch}
                    className="search-input"
                    required
                />
            </div>
        </header>
    );
};

export default Navbar;