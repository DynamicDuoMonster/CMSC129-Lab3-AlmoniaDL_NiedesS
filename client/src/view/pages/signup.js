import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api' // Import your axios instance
import '../styles/signup.css'

const Signup = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Use your axios instance 'api'
      const response = await api.post('/api/user/signup', formData)

      // Axios puts the response body in .data
      const json = response.data

      // 1. Save user to local storage
      localStorage.setItem('user', JSON.stringify(json))
      
      // 2. Redirect
      setIsLoading(false)
      navigate('/')
      
    } catch (err) {
      setIsLoading(false)
      // Axios errors are inside response.data
      setError(err.response?.data?.error || 'Something went wrong')
    }
  }

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2>Create an Account</h2>
        <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '10px' }}>
          Join us today to get started.
        </p>
        
        <div className="input-group">
          <label>Username</label>
          <input 
            type="text" 
            placeholder="johndoe"
            onChange={(e) => setFormData({...formData, username: e.target.value})} 
            value={formData.username} 
            required
          />
        </div>

        <div className="input-group">
          <label>Email Address</label>
          <input 
            type="email" 
            placeholder="example@mail.com"
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
            value={formData.email} 
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input 
            type="password" 
            placeholder="••••••••"
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
            value={formData.password} 
            required
          />
        </div>

        <button className="submit-btn" disabled={isLoading}>
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>

        {error && <div className="error-message">{error}</div>}

        <div className="redirect-main">
          <p style={{ fontSize: '0.85rem', color: '#888' }}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </form>
    </div>
  )
}

export default Signup
