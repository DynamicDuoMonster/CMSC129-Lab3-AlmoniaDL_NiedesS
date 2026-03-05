import { useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import '../styles/forgotPassword.css'; 

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleRequest = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const res = await api.post('/api/user/forgot-password', { email });
            setToken(res.data.resetToken);
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.error || "User not found");
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await api.post('/api/user/reset-password', { token, newPassword });
            alert("Success! Password updated in Atlas & Azure.");
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || "Reset failed");
        }
    };

    return (
        <div className="login-container">
            <div className="login-form">
                {step === 1 ? (
                    <form onSubmit={handleRequest}>
                        <h2>Reset Password</h2>
                        <p style={{ marginBottom: '20px', fontSize: '0.9rem', color: '#666' }}>
                            Enter your email to generate a sync-token.
                        </p>

                        <label>Email:</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <button type="submit">Get Reset Token</button>
                    </form>
                ) : (
                    <form onSubmit={handleReset}>
                        <h2>New Password</h2>
                        <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '15px' }}>
                            Token verified. Please enter your new password.
                        </p>

                        <label>New Password:</label>
                        <input
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />

                        <button type="submit">Update Password</button>
                    </form>
                )}

                {error && <div className="error" style={{ marginTop: '15px' }}>{error}</div>}

                <div className="login-footer">
                    <button
                        onClick={() => navigate('/login')}
                        style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', textDecoration: 'underline' }}
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;