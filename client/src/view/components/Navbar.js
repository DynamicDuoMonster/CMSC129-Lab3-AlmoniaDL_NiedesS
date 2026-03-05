import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import '../styles/navbar.css';

const Navbar = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [shoeName, setShoeName] = useState('');
    const navigate = useNavigate();
    const location = useLocation();

    // Helper to see if a filter is currently active in the URL
    const isActiveFilter = (key, value) => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get(key) === value;
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        navigate('/login');
    };

    const handleSearch = (e) => {
        const query = e.target.value;
        setShoeName(query);

        if (query.length > 0) {
            navigate(`/search?q=${query}`); // Changed 'name' to 'q' to match your controller
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
                {/* We use Link to /search with query params to trigger the unified controller */}
                <Link 
                    to="/search?category=Lifestyle" 
                    className={isActiveFilter('category', 'Lifestyle') ? "nav-item active" : "nav-item"}
                >
                    Lifestyle
                </Link>
                <Link 
                    to="/search?category=Sports" 
                    className={isActiveFilter('category', 'Sports') ? "nav-item active" : "nav-item"}
                >
                    Sports
                </Link>
                <Link 
                    to="/search?gender=Mens" 
                    className={isActiveFilter('gender', 'Mens') ? "nav-item active" : "nav-item"}
                >
                    Mens
                </Link>
                <Link 
                    to="/search?gender=Womens" 
                    className={isActiveFilter('gender', 'Womens') ? "nav-item active" : "nav-item"}
                >
                    Womens
                </Link>
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
                    <div className="nav-auth">
                        <NavLink to="/login" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                            Log in
                        </NavLink>
                        <NavLink to="/signup" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                            Sign up
                        </NavLink>
                    </div>
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