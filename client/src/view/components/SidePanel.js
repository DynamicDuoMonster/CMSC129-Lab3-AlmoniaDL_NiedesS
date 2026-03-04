import '../styles/dashboard.css';

const SidePanel = ({ isOpen, onClose, title, children }) => {
  return (
    <>
      {isOpen && <div className="panel-overlay" onClick={onClose} />}
      <div className={`side-panel ${isOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </>
  );
};

export default SidePanel;