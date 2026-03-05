import { useEffect, useState } from 'react';
import api from '../../api';
import SidePanel from './SidePanel';
import CheckoutModal from './CheckoutModal';
import '../styles/cart.css';

const CartPanel = ({ isOpen, onClose }) => {
  const [cart, setCart] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCart();
      setOrderPlaced(false);
    }
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
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };

  const handleQuantity = async (shoeId, currentQty, delta) => {
    const newQty = currentQty + delta;
    if (newQty < 1) {
      handleRemove(shoeId);
      return;
    }
    try {
      const res = await api.patch(`/api/cart/${shoeId}`, { quantity: newQty });
      setCart(res.data);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const handleCheckout = async () => {
    try {
      await api.delete('/api/cart');
      setCart({ items: [] });
      setShowCheckout(false);
      setOrderPlaced(true);
      window.dispatchEvent(new Event('cart-updated'));
    } catch (err) {
      console.error('Checkout failed:', err);
    }
  };

  const total = cart?.items?.reduce((sum, item) => sum + item.shoe.price * item.quantity, 0) || 0;

  return (
    <>
      <SidePanel isOpen={isOpen} onClose={onClose} title="Your Cart">
        <div className="cart-panel">
          {orderPlaced ? (
            <div className="cart-order-success">
              <p>🎉 Order placed successfully!</p>
              <p>Thank you for your purchase.</p>
            </div>
          ) : !cart || cart.items.length === 0 ? (
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
                      <div className="cart-item-qty-controls">
                        <button className="qty-btn" onClick={() => handleQuantity(item.shoe._id, item.quantity, -1)}>−</button>
                        <span className="qty-value">{item.quantity}</span>
                        <button className="qty-btn" onClick={() => handleQuantity(item.shoe._id, item.quantity, +1)}>+</button>
                      </div>
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
                <button className="checkout-btn" onClick={() => setShowCheckout(true)}>Checkout</button>
              </div>
            </>
          )}
        </div>
      </SidePanel>

      {showCheckout && (
        <CheckoutModal
          cart={cart}
          onConfirm={handleCheckout}
          onCancel={() => setShowCheckout(false)}
        />
      )}
    </>
  );
};

export default CartPanel;