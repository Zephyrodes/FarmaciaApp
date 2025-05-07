// src/components/OrderForm.js
import React, { useState, useEffect, useContext } from 'react';
import api from '../services/api';                   // tu axios configurado
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from './CheckoutForm';           // tu CheckoutForm ya estilizado

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

export default function OrderForm() {
  const { token } = useContext(AuthContext);
  const { cartItems } = useCart();
  const [order, setOrder] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (!token) throw new Error('Debes iniciar sesión.');

        // 1) Empaqueta tus ítems reales
        const itemsPayload = cartItems.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }));
        if (itemsPayload.length === 0) {
          throw new Error('Tu carrito está vacío.');
        }

        // 2) Crear la orden
        const { data: { order_id } } = await api.post('/orders/', { items: itemsPayload });

        // 3) Obtener detalles de la orden
        const { data: orderDetails } = await api.get(`/orders/${order_id}`);
        setOrder(orderDetails);

        // 4) Crear el PaymentIntent
        const { data: { clientSecret } } = await api.post('/create-payment-intent', { order_id });
        setClientSecret(clientSecret);

      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message
        );
      }
    })();
  }, [cartItems, token]);

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-12 p-4 bg-red-50 text-red-700 rounded-lg shadow">
        {error}
      </div>
    );
  }
  if (!order) {
    return <p className="text-center mt-12 text-gray-500">Cargando orden…</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Resumen de la orden */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Ítems de la Orden</h2>
        {order.items.map(item => (
          <div key={item.id} className="flex justify-between py-2 border-b last:border-b-0">
            <div>
              <p className="font-medium">{item.product.name}</p>
              <p className="text-sm text-gray-500">Cantidad: {item.quantity}</p>
            </div>
            <p className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
          </div>
        ))}
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <span className="text-lg font-semibold">Total:</span>
          <span className="text-lg font-bold">${order.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Formulario de pago */}
      {order.payment_status !== 'paid' ? (
        <div className="bg-white rounded-lg shadow p-6">
          <Elements stripe={stripePromise}>
            <CheckoutForm 
              clientSecret={clientSecret} 
              orderId={order.id}      // ← aquí pasas el orderId
            />
          </Elements>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-lg text-center font-semibold">
          ✅ Pago recibido
        </div>
      )}
    </div>
  );
}
