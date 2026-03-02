import { useEffect, useState } from "react"

// components
import ShoeDetails from '../components/ShoeDetails'

const Home = () => {
    const [shoes, setShoes] = useState(null)

    useEffect(() => {
        const fetchShoes = async () => {
            const response = await fetch('http://localhost:5000/api/shoes')
            const json = await response.json()

            if (response.ok) {
                setShoes(json)
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