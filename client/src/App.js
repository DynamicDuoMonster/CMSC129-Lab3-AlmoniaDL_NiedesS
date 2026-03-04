import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// pages and components
import Home from './view/pages/home'
import Navbar from './view/components/Navbar'
import Login from './view/pages/login'
import Employee from './view/pages/dashboard';
import SearchResults from './view/pages/search_results';
import Signup from './view/pages/signup';
import ShoeInfo from './view/pages/shoe_info'

const Layout = () => {
  const location = useLocation();
  
  // Define paths where you DON'T want the navbar to show
  const hideNavbarPaths = ['/login', '/admin', '/signup'];

  return (
    <>
      {!hideNavbarPaths.includes(location.pathname) && <Navbar />}
      
      <div className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Employee />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/shoe/:id" element={<ShoeInfo />} />
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