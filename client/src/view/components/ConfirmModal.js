import '../styles/dashboard.css';

const ConfirmModal = ({ message, onConfirm, onCancel }) => (
  <>
    <div className="modal-overlay" onClick={onCancel} />
    <div className="confirm-modal">
      <p>{message}</p>
      <div className="confirm-actions">
        <button className="confirm-cancel-btn" onClick={onCancel}>Cancel</button>
        <button className="confirm-delete-btn" onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </>
);

export default ConfirmModal;