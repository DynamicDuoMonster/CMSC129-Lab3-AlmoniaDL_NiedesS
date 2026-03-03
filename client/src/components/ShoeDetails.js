import '../styles/shoeDetails.css'

const ShoeDetails = ({ shoe }) => {
    return (
        <div className="shoe-details">
            <div className="shoe-image-container">
                {/* Using the real imageUrl from your MongoDB document */}
                {shoe.imageUrl && (
                    <img src={shoe.imageUrl} alt={`${shoe.brand} ${shoe.shoe_name}`} />
                )}
            </div>
            
            <div className="shoe-info">
                <span className="brand-badge">{shoe.brand}</span>
                <h4>{shoe.shoe_name}</h4>
                
                {/* Join the color array into a string (e.g., "Pink, Blue") */}
                <p className="color">
                    {shoe.color && shoe.color.join(', ')}
                </p>
                
                {/* Optional category/gender display (only shows if they exist) */}
                {(shoe.category || shoe.gender) && (
                    <p className="tags">{shoe.gender} {shoe.category}</p>
                )}

                <p className="price">${shoe.price.toLocaleString()}</p>
            </div>
        </div>
    )
}

export default ShoeDetails