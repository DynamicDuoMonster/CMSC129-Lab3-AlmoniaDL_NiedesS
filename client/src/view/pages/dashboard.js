import { useEffect, useState } from 'react';
import api from '../../api';
import AdminShoeCard from '../components/AdminShoeCard';
import AddShoeForm from '../components/AddShoeForm';
import SidePanel from '../components/SidePanel';
import '../styles/dashboard.css';
import '../styles/shoeDisplay.css';
import EditShoeModal from '../components/EditShoeModal';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [editShoe, setEditShoe] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [shoes, setShoes] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const fetchShoes = async () => {
      try {
        const res = await api.get('/api/shoes');
        setShoes(res.data);
      } catch (err) {
        console.error('Error fetching shoes:', err);
      }
    };
    fetchShoes();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };
  const handleEdit = (shoe) => {
  setEditShoe(shoe);
  setEditModalOpen(true);
  };
  const handleEditSuccess = (updatedShoe) => {
  setShoes(shoes.map(s => s._id === updatedShoe._id ? updatedShoe : s));
  setEditModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this shoe?')) return;
    try {
      await api.delete(`/api/shoes/${id}/soft`);
      setShoes(shoes.filter(shoe => shoe._id !== id));
    } catch (err) {
      console.error('Error deleting shoe:', err);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>All Products</h2>
        <div className="header-actions">
          <button className="trash-btn" onClick={() => navigate('/trash')}>🗑 Trash</button>
          <button className="add-btn" onClick={() => setPanelOpen(true)}>+ Add Shoe</button>
          <button className="logout-btn" onClick={handleLogout}>Log Out</button>  {/* 👈 */}
        </div>
      </div>

      <div className="shoes">
        {shoes && shoes.map((shoe) => (
          <AdminShoeCard key={shoe._id} shoe={shoe} onDelete={handleDelete} onEdit={handleEdit} />
        ))}
      </div>
       {editModalOpen && (              
        <EditShoeModal
          shoe={editShoe}
          onSuccess={handleEditSuccess}
          onClose={() => setEditModalOpen(false)}
          />
          )} 
          <SidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} title="Add New Shoe">
        <AddShoeForm onSuccess={(newShoe) => {
          setShoes([...shoes, newShoe]);
          setPanelOpen(false);
        }} />
      </SidePanel>
    </div>
  );
};

export default AdminDashboard;