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
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    if (shoe) {
      setShoeName(shoe.shoe_name || '');
      setBrand(shoe.brand || '');
      setPrice(shoe.price || '');
      setCategory(shoe.category || '');
      setGender(shoe.gender || '');
      setExistingImages(shoe.imageUrl || []);
      
      if (Array.isArray(shoe.color)) {
        setColor(shoe.color.join(', '));
      } else {
        setColor(shoe.color || '');
      }
    }
  }, [shoe]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const colorArray = color.split(',').map(c => c.trim()).filter(c => c !== "");

    try {
      const res = await api.patch(`/api/shoes/${shoe._id}`, {
        shoe_name: shoeName,
        brand,
        price: Number(price),
        color: colorArray,
        category,
        gender,
        imageUrl: existingImages
      });

      onSuccess(res.data);
      onClose(); // Close modal on success
    } catch (err) {
      console.error('Error updating shoe:', err);
      alert('Error updating shoe. Check console for details.');
    }
  };

  if (!shoe) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />

      <div className="modal">
        <div className="panel-header">
          <h3>Edit Product</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="edit-image-preview-row">
            {existingImages.map((url, i) => (
              <img key={i} src={url} alt="Current" className="mini-preview" />
            ))}
          </div>

          <label>Shoe Name</label>
          <input type="text" value={shoeName} onChange={(e) => setShoeName(e.target.value)} required />

          <label>Brand</label>
          <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} required />

          <label>Price ($)</label>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required />

          <label>Colors (separate with commas)</label>
          <input type="text" value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. Red, Black, White" required />

          <div className="select-row">
            <div>
              <label>Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select...</option>
                <option value="Running">Running</option>
                <option value="Basketball">Basketball</option>
                <option value="Lifestyle">Lifestyle</option>
              </select>
            </div>
            <div>
              <label>Gender</label>
              <select value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="">Select...</option>
                <option value="Mens">Mens</option>
                <option value="Womens">Womens</option>
                <option value="Kids">Kids</option>
              </select>
            </div>
          </div>

          <button type="submit" className="upload-btn">Save Changes</button>
        </form>
      </div>
    </>
  );
};

export default EditShoeModal;
