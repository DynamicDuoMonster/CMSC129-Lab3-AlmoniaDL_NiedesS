import { useState, useEffect, useRef } from 'react';
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
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const fileInputRef = useRef(null);

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

  const handleNewFiles = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map(f => URL.createObjectURL(f));
    setNewImages(prev => [...prev, ...files]);
    setNewPreviews(prev => [...prev, ...previews]);
  };

  const removeExisting = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNew = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const colorArray = color.split(',').map(c => c.trim()).filter(c => c !== "");

    try {
      if (newImages.length > 0) {
        // Use FormData if there are new images to upload
        const formData = new FormData();
        formData.append('shoe_name', shoeName);
        formData.append('brand', brand);
        formData.append('price', Number(price));
        formData.append('color', colorArray.join(','));
        formData.append('category', category);
        formData.append('gender', gender);
        formData.append('existingImages', JSON.stringify(existingImages));
        newImages.forEach(img => formData.append('image', img));

        const res = await api.patch(`/api/shoes/${shoe._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        onSuccess(res.data);
      } else {
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
      }
      onClose();
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

          {/* Existing images */}
          {existingImages.length > 0 && (
            <div>
              <label>Current Images</label>
              <div className="edit-image-preview-row">
                {existingImages.map((url, i) => (
                  <div key={i} className="preview-item-wrapper">
                    <img src={url} alt="Current" className="mini-preview" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeExisting(i)}
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New image previews */}
          {newPreviews.length > 0 && (
            <div>
              <label>New Images</label>
              <div className="edit-image-preview-row">
                {newPreviews.map((url, i) => (
                  <div key={i} className="preview-item-wrapper">
                    <img src={url} alt="New" className="mini-preview" />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeNew(i)}
                    >✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload button */}
          <button
            type="button"
            className="change-image-btn"
            onClick={() => fileInputRef.current.click()}
          >
            + Add / Change Images
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleNewFiles}
          />

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
                <option value="Sports">Sports</option>
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