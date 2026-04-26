import { useState, useEffect, useCallback, useRef } from 'react';
import '../styles/adminSearchBar.css';

/**
 * AdminSearchBar
 *
 * Props:
 *  - shoes       {Array}    Full shoe list from the dashboard
 *  - onResults   {Function} Called with the filtered array on every keystroke
 */
const AdminSearchBar = ({ shoes = [], onResults }) => {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  const getFiltered = useCallback((q) => {
    if (!q.trim()) return shoes;
    const lower = q.toLowerCase();
    return shoes.filter((shoe) =>
      shoe.shoe_name?.toLowerCase().includes(lower) ||
      shoe.brand?.toLowerCase().includes(lower) ||
      shoe.category?.toLowerCase().includes(lower) ||
      shoe.gender?.toLowerCase().includes(lower) ||
      shoe.color?.some?.((c) => c.toLowerCase().includes(lower))
    );
  }, [shoes]);

  useEffect(() => {
    onResults(getFiltered(query));
  }, [query, getFiltered, onResults]);

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const resultCount = query ? getFiltered(query).length : null;

  return (
    <div className={`asb-wrapper${focused ? ' asb-focused' : ''}`}>
      {/* Search icon */}
      <svg className="asb-icon-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>

      <input
        ref={inputRef}
        className="asb-input"
        type="text"
        placeholder="Search by name, brand, category…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      {/* Result count badge */}
      {query && (
        <span className="asb-count">{resultCount} found</span>
      )}

      {/* Clear button */}
      {query && (
        <button className="asb-clear" onClick={handleClear} aria-label="Clear search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default AdminSearchBar;