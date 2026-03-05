import { useState, useRef } from 'react';
import api from '../../api';
import '../styles/dashboard.css';

const AddShoeForm = ({ onSuccess }) => {
  const fileInputRef = useRef(null);
  const [shoeName, setShoeName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('');
  const [gender, setGender] = useState('');
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const newPreviews = files.map(file => URL.createObjectURL(file));
    
    setImages(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...newPreviews]);
  }

  const handleDragOver = (e) => { e.preventDefault(); e.currentTarget.classList.add('drag-active'); };
  const handleDragLeave = (e) => { e.currentTarget.classList.remove('drag-active'); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-active');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    handleFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('shoe_name', shoeName);
    formData.append('brand', brand);
    formData.append('price', price);
    formData.append('color', color);
    formData.append('category', category);
    formData.append('gender', gender);

    images.forEach((img) => {
      formData.append('image', img);
    })

    try {
      const res = await api.post('/api/shoes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShoeName(''); setBrand(''); setPrice(''); setColor('');
      setCategory(''); setGender(''); setPreviews([]); setImages([]);
      onSuccess(res.data); 
    } catch (err) {
      console.error(err);
      alert('Error uploading shoe.');
    }
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div
        className={`preview-zone ${previews.length > 0 ? 'has-image' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={(e) => {
          document.getElementById('file-input').click();
        }}
      >
        {previews.length > 0 ? (
        <div className="preview-grid">
          {previews.map((url, index) => (
            <div key={index} className="preview-item-wrapper">
              <img 
                src={url} 
                alt={`Preview ${index}`} 
                className="image-preview-item" 
              />
              <button
                className="remove-image-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setImages(prev => prev.filter((_, i) => i !== index));
                  setPreviews(prev => prev.filter((_, i) => i !== index));
                }}
              >
                ✕
              </button>
            </div>
          ))}
            <div className="add-more-overlay">+ Add More</div>
          </div>
        ) : (
          <div className="preview-placeholder">
            <span>Drop Images Here or Click to Upload</span>
            <p>(You can select multiple files)</p>
          </div>
        )}

        <input 
          ref={fileInputRef}
          type="file" 
          id="file-input" 
          accept="image/*" 
          onChange={handleFileChange} 
          onClick={(e) => e.stopPropagation()} 
          multiple 
          style={{ display: 'none' }}
        />
      </div>

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

      <button type="submit" className="upload-btn">Add Product</button>
    </form>
  );
};

export default AddShoeForm;