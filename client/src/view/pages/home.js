/**
 * Home.js  (updated)
 * Main page — shoe grid + floating SoleBot chat widget.
 *
 * The widget calls onInventoryChange() after any successful CRUD
 * operation so the shoe list re-fetches automatically.
 */

import { useEffect, useState, useCallback } from "react";
import api from "../../api";
import "../styles/shoeDisplay.css";
import "../styles/shoeGrid.css";

import ShoeDetails from "../components/ShoeDetails";
import SoleBotWidget from "../components/SoleBotWidget";

const Home = () => {
  const [shoes, setShoes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchShoes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/shoes");
      setShoes(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching shoes:", err);
      setError("Failed to load shoes. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShoes();
  }, [fetchShoes]);

  return (
    <div className="shoe-display">
      <div className="shoes">
        {loading && <p style={{ padding: "2rem", color: "var(--color-text-secondary)" }}>Loading...</p>}
        {error && <p style={{ padding: "2rem", color: "var(--color-text-danger)" }}>{error}</p>}
        {shoes &&
          shoes.map((shoe) => <ShoeDetails key={shoe._id} shoe={shoe} />)}
      </div>

      {/* Floating AI chat widget — stays on top, out of the grid flow */}
      <SoleBotWidget onInventoryChange={fetchShoes} />
    </div>
  );
};

export default Home;