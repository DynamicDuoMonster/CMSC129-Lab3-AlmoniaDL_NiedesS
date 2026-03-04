import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../../api";
import '../styles/login.css'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate();

  const handleSubmit = async (e) =>{
    e.preventDefault();
    setError(null);

    try{
      const response = await api.post('/api/user/login', { email, password});
      localStorage.setItem('user', JSON.stringify(response.data));
      if (response.data.role === 'admin') {
        navigate('/admin');
      }else{
        navigate('/');
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
    }
  }
  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Welcome to SoleSearch</h2>
        <label>Email:</label>
        <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label>Password:</label>
        <input type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button type="submit">Log In</button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}

export default Login;