import { useState, useEffect } from 'react'
import '../styles/shoeDetails.css'

const ShoeDetails = ({ shoe }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Cycle through images only when hovered
  useEffect(() => {
    let interval;
    if (isHovered && shoe.imageUrl.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % shoe.imageUrl.length);
      }, 1200); // Change image every 1.2 seconds
    } else {
      setCurrentIndex(0); // Reset to first image when mouse leaves
    }
    return () => clearInterval(interval);
  }, [isHovered, shoe.imageUrl.length]);

  return (
    <div 
      className="shoe-details"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="shoe-image-container">
        {shoe.imageUrl && shoe.imageUrl.length > 0 && (
          <img 
            src={shoe.imageUrl[currentIndex]} 
            alt={`${shoe.shoe_name} - view ${currentIndex + 1}`} 
            className="fade-in"
            key={currentIndex} // Forces animation on image swap
          />
        )}
        
        {shoe.imageUrl.length > 1 && isHovered && (
          <div className="image-dots">
            {shoe.imageUrl.map((_, i) => (
              <div 
                key={i} 
                className={`dot ${i === currentIndex ? 'active' : ''}`}
              />
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
        <p className="price">${shoe.price.toLocaleString()}</p>
      </div>
    </div>
  )
}

export default ShoeDetails
