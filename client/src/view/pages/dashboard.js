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
import AdminSearchBar from '../components/AdminSearchBar';

const CATEGORY_FILTERS = ['Lifestyle', 'Sports'];
const GENDER_FILTERS   = ['Mens', 'Womens'];

// Default state — both dimensions unset
const DEFAULT_FILTERS = { category: null, gender: null };

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [editShoe, setEditShoe] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [shoes, setShoes] = useState(null);
  const [searchResults, setSearchResults] = useState(null);
  const [filteredShoes, setFilteredShoes] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  // Two independent filter slots — either or both can be active at once
  const [activeFilters, setActiveFilters] = useState(DEFAULT_FILTERS);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchShoes = useCallback(async () => {
    try {
      const res = await api.get('/api/shoes');
      setShoes(res.data);
      setSearchResults(res.data);
    } catch (err) {
      console.error('Error fetching shoes:', err);
    }
  }, []);

  useEffect(() => {
    fetchShoes();
  }, [fetchShoes]);

  // ── Apply both filters on top of search results ───────────────────────────
  useEffect(() => {
    if (!searchResults) return;

    let result = searchResults;

    if (activeFilters.category) {
      result = result.filter(
        (shoe) => shoe.category?.toLowerCase() === activeFilters.category.toLowerCase()
      );
    }

    if (activeFilters.gender) {
      result = result.filter(
        (shoe) =>
          !shoe.gender ||
          shoe.gender.trim() === '' ||
          shoe.gender.toLowerCase() === 'unisex' ||
          shoe.gender.toLowerCase() === activeFilters.gender.toLowerCase()
      );
    }

    setFilteredShoes(result);
  }, [activeFilters, searchResults]);

  // ── Toggle a filter pill; clicking the active one clears that slot ────────
  const toggleFilter = (key, value) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? null : value,
    }));
  };

  const clearAllFilters = () => setActiveFilters(DEFAULT_FILTERS);

  const hasActiveFilter = activeFilters.category || activeFilters.gender;

  // ── CRUD handlers ────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleEdit = (shoe) => {
    setEditShoe(shoe);
    setEditModalOpen(true);
  };

  const handleEditSuccess = (updatedShoe) => {
    const updated = shoes.map((s) => (s._id === updatedShoe._id ? updatedShoe : s));
    setShoes(updated);
    setSearchResults(updated);
    setEditModalOpen(false);
  };

  const handleDelete = (id) => setConfirmId(id);

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/shoes/${confirmId}/soft`);
      const remaining = shoes.filter((shoe) => shoe._id !== confirmId);
      setShoes(remaining);
      setSearchResults(remaining);
    } catch (err) {
      console.error('Error deleting shoe:', err);
    } finally {
      setConfirmId(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>All Products</h2>

        <AdminSearchBar shoes={shoes || []} onResults={setSearchResults} />

        {/* Filter pills — two independent groups: category and gender */}
        <div className="filter-pills">
          {/* Category group */}
          <div className="filter-group">
            {CATEGORY_FILTERS.map((value) => {
              const isActive = activeFilters.category === value;
              return (
                <button
                  key={value}
                  className={`filter-pill${isActive ? ' active' : ''}`}
                  onClick={() => toggleFilter('category', value)}
                  aria-pressed={isActive}
                >
                  {value}
                  {isActive && <span className="pill-clear">×</span>}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <span className="filter-divider" />

          {/* Gender group */}
          <div className="filter-group">
            {GENDER_FILTERS.map((value) => {
              const isActive = activeFilters.gender === value;
              const label = value === 'Mens' ? "Men's" : "Women's";
              return (
                <button
                  key={value}
                  className={`filter-pill${isActive ? ' active' : ''}`}
                  onClick={() => toggleFilter('gender', value)}
                  aria-pressed={isActive}
                >
                  {label}
                  {isActive && <span className="pill-clear">×</span>}
                </button>
              );
            })}
          </div>

          {/* Clear all — only shown when at least one filter is active */}
          {hasActiveFilter && (
            <button className="filter-clear-btn" onClick={clearAllFilters}>
              Clear all
            </button>
          )}
        </div>

        <div className="header-actions">
          <button className="trash-btn" onClick={() => navigate('/trash')}>🗑 Trash</button>
          <button className="add-btn" onClick={() => setPanelOpen(true)}>+ Add Shoe</button>
          <button className="logout-btn" onClick={handleLogout}>Log Out</button>
        </div>
      </div>

      <div className="shoes">
        {filteredShoes &&
          filteredShoes.map((shoe) => (
            <AdminShoeCard
              key={shoe._id}
              shoe={shoe}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
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
        <AddShoeForm
          onSuccess={(newShoe) => {
            const updated = [...shoes, newShoe];
            setShoes(updated);
            setSearchResults(updated);
            setPanelOpen(false);
          }}
        />
      </SidePanel>

      <SoleBotWidget onInventoryChange={fetchShoes} />
    </div>
  );
};

export default AdminDashboard;