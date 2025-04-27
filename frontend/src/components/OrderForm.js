// src/components/OrderForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

const OrderForm = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      setError('Tu carrito está vacío.');
      return;
    }
    const orderItems = cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity
    }));
    try {
      await api.post('/orders/', { items: orderItems });
      clearCart();
      navigate('/orders');
    } catch (err) {
      console.error(err);
      setError('Error al crear la orden.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-violet-700 mb-4">Confirmar Orden</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <ul className="divide-y divide-gray-200">
          {cartItems.map((item) => (
            <li key={item.id} className="py-2">
              <div className="flex justify-between">
                <span>{item.name} (x{item.quantity})</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="submit"
          className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded w-full"
        >
          Confirmar Orden
        </button>
      </form>
    </div>
  );
};

export default OrderForm;
