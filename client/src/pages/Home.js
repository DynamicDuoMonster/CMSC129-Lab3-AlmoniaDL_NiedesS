import { useEffect, useState } from "react"
import api from "../api";
import '../styles/home.css'


// components
import ShoeDetails from '../components/ShoeDetails'

const Home = () => {
    const [shoes, setShoes] = useState(null)

    useEffect(() => {
        const fetchShoes = async () => {
            try {
                // If your 'api' instance has baseURL: 'http://localhost:5000/api'
                // you only need to fetch '/shoes'
                const response = await api.get('/api/shoes') 
                
                // Axios automatically parses JSON into 'data'
                setShoes(response.data) 
            } catch (error) {
                console.error("Error fetching shoes:", error)
            }
        }

        fetchShoes()
    }, [])

    return (
        <div className="home">
            <div className="shoes">
                {shoes && shoes.map((shoe) => (
                    <ShoeDetails key={shoe._id} shoe={shoe}/>
                ))}
            </div>
        </div>
    )
}

export default Home