// src/components/Cart.js
import React from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';


function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  const handleProceed = () => {
    navigate('/orders/new');
  };

  if (cartItems.length === 0) {
    return <p className="text-center mt-10 text-gray-500">Tu carrito está vacío.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-4 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-violet-700">🛒 Mi Carrito</h2>

      {cartItems.map((item) => (
        <div key={item.id} className="flex justify-between items-center mb-4 border-b pb-2">
          <div>
            <h3 className="font-semibold text-lg">{item.name}</h3>
            <p className="text-sm text-gray-500">${item.price} x {item.quantity}</p>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => updateQuantity(item.id, e.target.value)}
              className="w-16 border rounded px-2 py-1"
            />
            <button
              onClick={() => removeFromCart(item.id)}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
            >
              Eliminar
            </button>
          </div>
        </div>
      ))}

      <div className="text-right mt-6">
        <p className="text-lg font-semibold mb-4">Total: ${total.toFixed(2)}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={clearCart}
            className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded"
          >
            Vaciar carrito
          </button>
          <button
            onClick={handleProceed}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded"
          >
            Proceder con la orden
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
