import { useState, useEffect } from 'react';
import api from '../../api';
import '../styles/dashboard.css';

const EditShoeModal = ({ shoe, onSuccess, onClose }) => {
  const [shoeName, setShoeName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('');
  const [gender, setGender] = useState('');

  // 👇 pre-fill form with existing shoe data
  useEffect(() => {
    if (shoe) {
      setShoeName(shoe.shoe_name || '');
      setBrand(shoe.brand || '');
      setPrice(shoe.price || '');
      setColor(shoe.color || '');
      setCategory(shoe.category || '');
      setGender(shoe.gender || '');
    }
  }, [shoe]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/api/shoes/${shoe._id}`, {
        shoe_name: shoeName,
        brand,
        price,
        color,
        category,
        gender
      });
      onSuccess(res.data);  // 👈 pass updated shoe back to dashboard
    } catch (err) {
      console.error('Error updating shoe:', err);
      alert('Error updating shoe.');
    }
  };

  if (!shoe) return null;

  return (
    <>
      {/* Overlay */}
      <div className="modal-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="modal">
        <div className="panel-header">
          <h3>Edit Shoe</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <input type="text" placeholder="Shoe Name" value={shoeName} onChange={(e) => setShoeName(e.target.value)} required />
          <input type="text" placeholder="Brand (e.g. Nike)" value={brand} onChange={(e) => setBrand(e.target.value)} required />
          <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required />
          <input type="text" placeholder="Colors (comma separated)" value={color} onChange={(e) => setColor(e.target.value)} required />

          <div className="select-row">
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Category</option>
              <option value="Running">Running</option>
              <option value="Basketball">Basketball</option>
              <option value="Lifestyle">Lifestyle</option>
            </select>
            <select value={gender} onChange={(e) => setGender(e.target.value)}>
              <option value="">Gender</option>
              <option value="Mens">Mens</option>
              <option value="Womens">Womens</option>
              <option value="Kids">Kids</option>
            </select>
          </div>

          <button type="submit" className="upload-btn">Save Changes</button>
        </form>
      </div>
    </>
  );
};

export default EditShoeModal;