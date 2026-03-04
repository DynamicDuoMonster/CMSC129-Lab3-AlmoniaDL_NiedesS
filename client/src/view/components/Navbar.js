import { NavLink, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import '../styles/navbar.css';
import CartPanel from './CartPanel';

const Navbar = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [shoeName, setShoeName] = useState('');
    const [cartOpen, setCartOpen] = useState(false);
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
        <> 
            <header className="navbar-header">
                <div className="navbar-left">
                    <Link to="/" className="logo">
                        <h1>SoleSearch</h1>
                    </Link>
                    <input
                        type="text"
                        placeholder="Search shoes..."
                        value={shoeName}
                        onChange={handleSearch}
                        className="search-input"
                    />
                </div>

                <nav className="nav-pill">
                    <NavLink to="/Lifestyle" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>Lifestyle</NavLink>
                    <NavLink to="/Sports" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>Sports</NavLink>
                    <NavLink to="/Mens" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>Mens</NavLink>
                    <NavLink to="/Womens" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>Womens</NavLink>
                </nav>

                <div className="nav-right">
                    {user ? (
                        <div className="nav-account">
                            <button className="cart-icon-btn" onClick={() => setCartOpen(true)}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="9" cy="21" r="1"/>
                                <circle cx="20" cy="21" r="1"/>
                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                            </svg>
                            </button>
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
                </div>
            </header>

            <CartPanel isOpen={cartOpen} onClose={() => setCartOpen(false)} /> 
        </>
    );
};

export default Navbar;