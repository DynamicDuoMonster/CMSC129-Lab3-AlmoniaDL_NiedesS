import React, { useEffect, useState } from "react";
import api from "../../api";
import { useNavigate } from "react-router-dom";
import "../styles/trash.css";

const Trash = () => {
  const [trashedShoes, setTrashedShoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTrash = async () => {
    try {
      const res = await api.get("/api/shoes/trash");
      setTrashedShoes(res.data);
    } catch (err) {
      console.error("Failed to fetch trash", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrash();
  }, []);

  const handleRestore = async (id) => {
    try {
      await api.patch(`/api/shoes/${id}/restore`);
      setTrashedShoes((prev) => prev.filter((shoe) => shoe._id !== id));
    } catch (err) {
      console.error("Failed to restore shoe", err);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("Permanently delete this shoe? This cannot be undone.")) return;
    try {
      await api.delete(`/api/shoes/${id}`);
      setTrashedShoes((prev) => prev.filter((shoe) => shoe._id !== id));
    } catch (err) {
      console.error("Failed to permanently delete shoe", err);
    }
  };

  if (loading) return <p className="trash-loading">Loading trash...</p>;

  return (
    <div className="trash-page">
      <h1 className="trash-title">🗑 Trash</h1>
      <button className="trash-back-btn" onClick={() => navigate('/admin')}>
        ← Back to Dashboard
      </button>

      {trashedShoes.length === 0 ? (
        <p className="trash-empty">Trash is empty.</p>
      ) : (
        <div className="trash-grid">
          {trashedShoes.map((shoe) => (
            <div key={shoe._id} className="trash-card">
              {shoe.imageUrl && shoe.imageUrl.length > 0 && (
                <img
                  src={shoe.imageUrl[0]}
                  alt={shoe.shoe_name}
                  className="trash-card-img"
                />
              )}
              <h3 className="trash-card-name">{shoe.shoe_name}</h3>
              <p className="trash-card-price">${shoe.price}</p>
              <button className="btn-restore" onClick={() => handleRestore(shoe._id)}>
                Restore
              </button>
              <button className="btn-permanent-delete" onClick={() => handlePermanentDelete(shoe._id)}>
                Delete Permanently
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Trash;