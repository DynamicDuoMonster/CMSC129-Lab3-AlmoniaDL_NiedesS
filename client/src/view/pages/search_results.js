import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from '../../api';
import '../styles/shoeGrid.css'
import '../styles/shoeDisplay.css'

// components
import ShoeDetails from "../components/ShoeDetails";

const SearchResults = () => {
    const [searchParams] = useSearchParams();
    const [shoes, setShoes] = useState([]);
    const [loading, setLoading] = useState(true);

    const query = searchParams.get("name");

    useEffect(() => {
        const fetchShoes = async () => {
            try {
                const response = await api.get(`/api/shoes/search?name=${query}`);
                setShoes(response.data); // Axios puts results in .data
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        };

        if (query) {
            fetchShoes();
        } else {
            setLoading(false);
        }
    }, [query]); // Re-runs every time the user types and the URL changes

    return (
        <div className="search-page">
            <h2>Results for: "{query}"</h2>

            {loading && <p>Loading shoes...</p>}

            {!loading && shoes.length === 0 && <p>No shoes found matching that name.</p>}

            <div className="shoe-display">
                <div className="shoe">
                    {shoes && shoes.map((shoe) => (
                        <ShoeDetails key={shoe._id} shoe={shoe} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SearchResults;
