import '../styles/shoeDetails.css'

const ShoeDetails = ({ shoe }) => {
  return (
    <div className="shoe-details">
      <div className="shoe-image-container">
        {shoe.imageUrl && <img src={shoe.imageUrl} alt={shoe.shoe_name} />}
      </div>

      <div className="shoe-info">
        <span className="brand-badge">{shoe.brand}</span>
        <h4>{shoe.shoe_name}</h4>
        
        {/* Render Gender and Category if they exist */}
        <p className="tags">
          {shoe.gender} {shoe.category}
        </p>

        <p className="price">${shoe.price.toLocaleString()}</p>
      </div>
    </div>
  )
}

export default ShoeDetails