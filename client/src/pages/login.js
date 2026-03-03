import { NavLink } from 'react-router-dom';

import '../styles/login.css'

const Login = () => {
  return (
    <div className="login-container">
      <form className="login-form">
        <h2>Welcome to SoleSearch</h2>
        <label>Email:</label>
        <input type="email" placeholder="Enter your email" />

        <label>Password:</label>
        <input type="password" placeholder="Enter your password" />

        <button type="submit">Log In</button>
        <div className="redirect-main">
          <NavLink to="/">Back to main page</NavLink>
        </div>
      </form>
    </div>
  );
}

export default Login;