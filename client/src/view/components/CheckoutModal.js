import api from '../../api';
import '../styles/dashboard.css';

const CheckoutModal = ({ cart, onConfirm, onCancel }) => {
  const total = cart?.items?.reduce((sum, item) => sum + item.shoe.price * item.quantity, 0) || 0;
  const itemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <>
      <div className="modal-overlay" onClick={onCancel} />
      <div className="confirm-modal">
        <p>You have <strong>{itemCount} item{itemCount !== 1 ? 's' : ''}</strong> totalling <strong>${total.toLocaleString()}</strong>.</p>
        <p>Confirm your order?</p>
        <div className="confirm-actions">
          <button className="confirm-cancel-btn" onClick={onCancel}>Cancel</button>
          <button className="confirm-delete-btn" onClick={onConfirm}>Place Order</button>
        </div>
      </div>
    </>
  );
};

export default CheckoutModal;