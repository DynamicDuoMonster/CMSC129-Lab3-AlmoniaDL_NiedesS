import { useEffect, useState } from "react"
import api from "../../api";
import '../styles/shoeDisplay.css'


// components
import ShoeDetails from '../components/ShoeDetails'

const Home = () => {
    const [shoes, setShoes] = useState(null)

    useEffect(() => {
        const fetchShoes = async () => {
            try {
                const response = await api.get('/api/shoes') 

                setShoes(response.data) 
            } catch (error) {
                console.error("Error fetching shoes:", error)
            }
        }

        fetchShoes()
    }, [])

    return (
        <div className="shoe-display">
            <div className="shoes">
                {shoes && shoes.map((shoe) => (
                    <ShoeDetails key={shoe._id} shoe={shoe}/>
                ))}
            </div>
        </div>
    )
}

export default Home