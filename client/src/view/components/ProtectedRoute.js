import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const user = localStorage.getItem('user'); 
  
  // DEBUGGING: This will tell us if your code even sees the user
  console.log("ProtectedRoute - Found user in localStorage:", user);
  
  if (!user) {
    console.log("ProtectedRoute - No user found, redirecting to login.");
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;