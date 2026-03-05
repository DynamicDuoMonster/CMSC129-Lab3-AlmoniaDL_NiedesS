import { useEffect, useState } from 'react';
import api from '../../api';
import SidePanel from './SidePanel';
import '../styles/cart.css';

const CartPanel = ({ isOpen, onClose }) => {
  const [cart, setCart] = useState(null);

  useEffect(() => {
    if (isOpen) fetchCart();
  }, [isOpen]); 

  const fetchCart = async () => {
    try {
      const res = await api.get('/api/cart');
      setCart(res.data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  const handleRemove = async (shoeId) => {
    try {
      const res = await api.delete(`/api/cart/${shoeId}`);
      setCart(res.data);
      window.dispatchEvent(new Event('cart-updated')) // ← notify navbar
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  const total = cart?.items?.reduce((sum, item) => sum + item.shoe.price * item.quantity, 0) || 0;

  return (
    <SidePanel isOpen={isOpen} onClose={onClose} title="Your Cart">
      <div className="cart-panel">
        {!cart || cart.items.length === 0 ? (
          <p className="cart-empty">Your cart is empty.</p>
        ) : (
          <>
            <div className="cart-items">
              {cart.items.map((item) => (
                <div key={item.shoe._id} className="cart-item">
                  <img src={item.shoe.imageUrl} alt={item.shoe.shoe_name} />
                  <div className="cart-item-info">
                    <p className="cart-item-name">{item.shoe.shoe_name}</p>
                    <p className="cart-item-brand">{item.shoe.brand}</p>
                    <p className="cart-item-price">${item.shoe.price.toLocaleString()}</p>
                    <p className="cart-item-qty">Qty: {item.quantity}</p>
                  </div>
                  <button className="cart-remove-btn" onClick={() => handleRemove(item.shoe._id)}>✕</button>
                </div>
              ))}
            </div>

            <div className="cart-footer">
              <div className="cart-total">
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
              </div>
              <button className="checkout-btn">Checkout</button>
            </div>
          </>
        )}
      </div>
    </SidePanel>
  );
};

export default CartPanel;