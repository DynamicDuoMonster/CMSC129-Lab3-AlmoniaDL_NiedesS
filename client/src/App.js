import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// pages and components
import Home from './view/pages/home'
import Navbar from './view/components/Navbar'
import Login from './view/pages/login'
import Employee from './view/pages/dashboard';
import SearchResults from './view/pages/search_results';

const Layout = () => {
  const location = useLocation();
  
  // Define paths where you DON'T want the navbar to show
  const hideNavbarPaths = ['/login', '/admin'];

  return (
    <>
      {!hideNavbarPaths.includes(location.pathname) && <Navbar />}
      
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Employee />} />
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