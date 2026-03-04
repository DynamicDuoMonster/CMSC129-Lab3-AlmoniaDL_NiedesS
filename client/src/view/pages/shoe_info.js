import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api'
import '../styles/shoeInfo.css'

const ShoeInfo = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [shoe, setShoe] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const handleAddToCart = async () => {
    try {
        await api.post('/api/cart', { shoeId: shoe._id })
        alert('Added to cart!')
    } catch (err) {
        console.error(err)
        alert(err.response?.data?.error || 'Failed to add to cart')
    }
}
  useEffect(() => {
    const fetchShoe = async () => {
      try {
        const response = await api.get(`/api/shoes/${id}`)
        setShoe(response.data)
        setLoading(false)
      } catch (err) {
        setError(err.response?.data?.error || "Shoe not found")
        setLoading(false)
      }
    }
    fetchShoe()
  }, [id])

  if (loading) return <div className="loading-state">Loading shoe details...</div>
  if (error) return <div className="error-state">{error}</div>

  return (
    <div className="shoe-details-container">
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
      
      <div className="shoe-details-grid">
        <div className="shoe-image-box">
          {/* Handles both single string or array of images */}
          <img src={Array.isArray(shoe.imageUrl) ? shoe.imageUrl[0] : shoe.imageUrl} alt={shoe.shoe_name} />
        </div>

        <div className="shoe-info-box">
          <span className="brand-label">{shoe.brand}</span>
          <h1 className="shoe-title">{shoe.shoe_name}</h1>
          <p className="shoe-sub">{shoe.gender}'s {shoe.category}</p>
          
          <div className="price-tag">${shoe.price}</div>

          <div className="details-section">
            <h4>Available Colors</h4>
            <div className="color-pills">
              {shoe.color.map((c, i) => (
                <span key={i} className="pill">{c}</span>
              ))}
            </div>
          </div>

          <button className="buy-now-btn" onClick={handleAddToCart}>Add to Cart</button>
          
          <div className="description-box">
            <p>Premium craftsmanship from {shoe.brand}. This {shoe.category} is built for performance and style.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ShoeInfo
