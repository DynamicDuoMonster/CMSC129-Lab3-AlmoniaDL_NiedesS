import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom' // Import this
import '../styles/shoeDetails.css'

const ShoeDetails = ({ shoe, disableClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate(); // Initialize navigate

  // Click handler to redirect
  const handleCardClick = () => {
    if (disableClick) return;
    navigate(`/shoe/${shoe._id}`);
  };
  useEffect(() => {
    let interval;
    if (isHovered && shoe.imageUrl.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % shoe.imageUrl.length);
      }, 1200);
    } else {
      setCurrentIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, shoe.imageUrl.length]);

  return (
    <div 
      className="shoe-details"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      style={{ cursor: disableClick ? 'default' : 'pointer' }}
    >
      <div className="shoe-image-container">
        {shoe.imageUrl && shoe.imageUrl.length > 0 && (
          <img 
            src={shoe.imageUrl[currentIndex]} 
            alt={`${shoe.shoe_name}`} 
            className="fade-in"
            key={currentIndex} 
          />
        )}
        
        {shoe.imageUrl.length > 1 && isHovered && (
          <div className="image-dots">
            {shoe.imageUrl.map((_, i) => (
              <div key={i} className={`dot ${i === currentIndex ? 'active' : ''}`} />
            ))}
          </div>
        )}
      </div>

      <div className="shoe-info">
        <span className="brand-badge">{shoe.brand}</span>
        <h4>{shoe.shoe_name}</h4>
        <p className="tags">
          {[shoe.gender, shoe.category].filter(Boolean).join(' • ')}
        </p>
        <p className="price">P{shoe.price.toLocaleString()}</p>
      </div>
    </div>
  )
}

export default ShoeDetails
