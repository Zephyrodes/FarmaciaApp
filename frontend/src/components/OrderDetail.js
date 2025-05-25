import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

// Stripe.js & React Stripe.js
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import CheckoutForm from '../components/CheckoutForm';

// Carga tu clave pública desde el .env de React
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const fetchOrderDetail = useCallback(async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar la orden. Intenta de nuevo.');
    }
  }, [id]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  if (error) {
    return <p className="text-red-600 text-center mt-4">{error}</p>;
  }
  if (!order) {
    return <p className="text-center mt-4">Cargando detalles…</p>;
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-violet-700 mb-4">
        Detalle de la Orden #{order.id}
      </h2>

      <div className="space-y-2 mb-6">
        <p className="text-gray-700">
          <span className="font-semibold">Cliente ID:</span> {order.client_id}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Total:</span> ${order.total}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Status:</span>{' '}
          <span className="capitalize">{order.status}</span>
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Fecha de creación:</span>{' '}
          {new Date(order.created_at).toLocaleString()}
        </p>
      </div>

      <h3 className="text-lg font-semibold mb-2">🧾 Ítems de la Orden</h3>
      {order.items && order.items.length > 0 ? (
        <ul className="divide-y divide-gray-200 mb-6">
          {order.items.map((item) => (
            <li key={item.id} className="py-2 flex justify-between">
              <div>
                <p className="font-medium text-gray-800">
                  {item.product.name}
                </p>
                <p className="text-gray-500">Cantidad: {item.quantity}</p>
              </div>
              <p className="text-gray-700 font-semibold">
                ${item.product.price * item.quantity}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 mb-6">No hay ítems en esta orden.</p>
      )}

      {/* Formulario de pago Stripe si no está pagada */}
      {order.payment_status !== 'paid' ? (
        <div className="mb-6">
          <Elements stripe={stripePromise}>
            <CheckoutForm orderId={order.id} />
          </Elements>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded">
          <p className="font-semibold">✅ Pago recibido</p>
        </div>
      )}

      <div className="mt-6 text-right">
        <Link to="/orders">
          <button className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded">
            ← Volver a Órdenes
          </button>
        </Link>
      </div>
    </div>
  );
};

export default OrderDetail;
