import { useState } from 'react'

const Test = () => {
    const [formData, setFormData] = useState({
        shoe_name: '',
        brand: '',
        color: '',
        price: ''
    })
    const [image, setImage] = useState(null)
    const [preview, setPreview] = useState(null)
    const [response, setResponse] = useState(null)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleImage = (e) => {
        const file = e.target.files[0]
        setImage(file)
        setPreview(URL.createObjectURL(file))  // preview before upload
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        const data = new FormData()
        data.append('shoe_name', formData.shoe_name)
        data.append('brand', formData.brand)
        data.append('color', formData.color)
        data.append('price', formData.price)
        data.append('image', image)

        const res = await fetch('http://localhost:5000/api/shoes', {
            method: 'POST',
            body: data   // don't set Content-Type, browser does it automatically
        })

        const result = await res.json()
        setResponse(result)
        console.log(result)
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Test Add Shoe</h2>

            <form onSubmit={handleSubmit}>
                <div>
                    <input
                        name="shoe_name"
                        placeholder="Shoe Name"
                        onChange={handleChange}
                    /><br/>
                    <input
                        name="brand"
                        placeholder="Brand"
                        onChange={handleChange}
                    /><br/>
                    <input
                        name="color"
                        placeholder="Color"
                        onChange={handleChange}
                    /><br/>
                    <input
                        name="price"
                        type="number"
                        placeholder="Price"
                        onChange={handleChange}
                    /><br/>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImage}
                    />
                </div>

                {/* Image preview */}
                {preview && (
                    <div>
                        <p>Preview:</p>
                        <img src={preview} alt="preview" width={150} />
                    </div>
                )}

                <button type="submit">Add Shoe</button>
            </form>

            {/* Show response from server */}
            {response && (
                <div>
                    <h3>Server Response:</h3>
                    <pre>{JSON.stringify(response, null, 2)}</pre>
                </div>
            )}
        </div>
    )
}

export default Test