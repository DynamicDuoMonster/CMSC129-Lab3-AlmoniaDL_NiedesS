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

    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const gender = searchParams.get("gender");

    const displayLabel = q || category || gender || "All Shoes";

    useEffect(() => {
        const fetchShoes = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/api/shoes/search?${searchParams.toString()}`);
                setShoes(response.data);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setLoading(false);
            }
        };

        if (q || category || gender) {
            fetchShoes();
        } else {
            setLoading(false);
        }
    }, [searchParams]);

    return (
        <div className="shoe-display">
            <h2 style={{ padding: '20px' }}>Showing: "{displayLabel}"</h2>

            {loading && <p>Loading shoes...</p>}

            {!loading && shoes.length === 0 && (
                <p style={{ padding: '20px' }}>No shoes found matching these filters.</p>
            )}

            <div className="shoes"> 
                {!loading && shoes.map((shoe) => (
                    <ShoeDetails key={shoe._id} shoe={shoe} />
                ))}
            </div>
        </div>
    );
};

export default SearchResults;