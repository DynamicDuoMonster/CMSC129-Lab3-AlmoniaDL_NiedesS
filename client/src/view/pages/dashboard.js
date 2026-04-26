import { useEffect, useState, useCallback } from 'react';
import api from '../../api';
import AdminShoeCard from '../components/AdminShoeCard';
import AddShoeForm from '../components/AddShoeForm';
import SidePanel from '../components/SidePanel';
import '../styles/dashboard.css';
import '../styles/shoeDisplay.css';
import EditShoeModal from '../components/EditShoeModal';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import SoleBotWidget from '../components/SoleBotWidget';
import AdminSearchBar from '../components/AdminSearchBar'; // ← new

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [editShoe, setEditShoe] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [shoes, setShoes] = useState(null);
  const [filteredShoes, setFilteredShoes] = useState(null); // ← new
  const [panelOpen, setPanelOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const fetchShoes = useCallback(async () => {
    try {
      const res = await api.get('/api/shoes');
      setShoes(res.data);
      setFilteredShoes(res.data); // keep filtered in sync on fresh fetch
    } catch (err) {
      console.error('Error fetching shoes:', err);
    }
  }, []);

  useEffect(() => {
    fetchShoes();
  }, [fetchShoes]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleEdit = (shoe) => {
    setEditShoe(shoe);
    setEditModalOpen(true);
  };

  const handleEditSuccess = (updatedShoe) => {
    const updated = shoes.map(s => s._id === updatedShoe._id ? updatedShoe : s);
    setShoes(updated);
    setFilteredShoes(updated);
    setEditModalOpen(false);
  };

  const handleDelete = (id) => {
    setConfirmId(id);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/shoes/${confirmId}/soft`);
      const remaining = shoes.filter(shoe => shoe._id !== confirmId);
      setShoes(remaining);
      setFilteredShoes(remaining);
    } catch (err) {
      console.error('Error deleting shoe:', err);
    } finally {
      setConfirmId(null);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>All Products</h2>

        {/* ── Search bar ── */}
        <AdminSearchBar shoes={shoes || []} onResults={setFilteredShoes} />

        <div className="header-actions">
          <button className="trash-btn" onClick={() => navigate('/trash')}>🗑 Trash</button>
          <button className="add-btn" onClick={() => setPanelOpen(true)}>+ Add Shoe</button>
          <button className="logout-btn" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <div className="shoes">
        {filteredShoes && filteredShoes.map((shoe) => (
          <AdminShoeCard key={shoe._id} shoe={shoe} onDelete={handleDelete} onEdit={handleEdit} />
        ))}
      </div>

      {confirmId && (
        <ConfirmModal
          message="Move this shoe to trash?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {editModalOpen && (
        <EditShoeModal
          shoe={editShoe}
          onSuccess={handleEditSuccess}
          onClose={() => setEditModalOpen(false)}
        />
      )}

      <SidePanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} title="Add New Shoe">
        <AddShoeForm onSuccess={(newShoe) => {
          const updated = [...shoes, newShoe];
          setShoes(updated);
          setFilteredShoes(updated);
          setPanelOpen(false);
        }} />
      </SidePanel>

      <SoleBotWidget onInventoryChange={fetchShoes} />
    </div>
  );
};

export default AdminDashboard;