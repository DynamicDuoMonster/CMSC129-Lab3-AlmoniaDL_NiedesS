import '../styles/shoeDetails.css'

const ShoeDetails = ({ shoe }) => {
    return (
        <div className="shoe-details">
            <h4>{shoe.shoe_name}</h4>
            <p>{shoe.color}</p>
            <p>{shoe.price}</p>
        </div>
    )
}

export default ShoeDetails