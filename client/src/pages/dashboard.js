import { useState } from 'react';
import axios from 'axios';
import '../styles/dashboard.css';

const AdminDashboard = () => {
  const [shoeName, setShoeName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('');
  const [gender, setGender] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null); // State for the live preview

  // Handle file selection (via click)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('drag-active');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('drag-active');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-active');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
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
    formData.append('image', image);

    try {
      const response = await axios.post('http://localhost:4000/api/shoes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Success! Shoe added to Cloudinary and MongoDB.');
      
      // Optional: Clear form after success
      setShoeName(''); setBrand(''); setPrice(''); setColor(''); 
      setPreview(null); setImage(null);
    } catch (err) {
      console.error(err);
      alert('Error uploading shoe. Check the console.');
    }
  };

  return (
    <div className="login-container">
      <form className="login-form admin-form" onSubmit={handleSubmit}>
        <h2>Shoe Management</h2>
        
        {/* Drag and Drop Zone / Preview Box */}
        <div 
          className={`preview-zone ${preview ? 'has-image' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="image-preview" />
          ) : (
            <div className="preview-placeholder">
              <span>Drop Image Here or Click to Upload</span>
              <p>(PNG/WebP with transparent BG recommended)</p>
            </div>
          )}
          <input 
            type="file" 
            id="file-input"
            accept="image/*" 
            onChange={handleFileChange} 
            hidden 
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
    </div>
  );
};

export default AdminDashboard;