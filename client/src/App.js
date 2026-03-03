import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// pages and components
import Home from './pages/Home'
import Navbar from './components/Navbar'
import Login from './pages/login'

const Layout = () => {
  const location = useLocation();
  
  // Define paths where you DON'T want the navbar to show
  const hideNavbarPaths = ['/login'];

  return (
    <>
      {!hideNavbarPaths.includes(location.pathname) && <Navbar />}
      
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App