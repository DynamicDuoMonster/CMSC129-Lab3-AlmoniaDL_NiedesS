

const ShoeDetails = ({ shoe }) => {
    return (
        <div className="shoe-details">
            <h4>{shoe.shoe_name}</h4>
            <p><strong>Color: </strong>{shoe.color}</p>
            <p><strong>Price: </strong>{shoe.price}</p>
        </div>
    )
}

export default ShoeDetails