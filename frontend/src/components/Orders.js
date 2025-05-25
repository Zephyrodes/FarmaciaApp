// src/components/Orders.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/orders/');
      setOrders(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Error al obtener las órdenes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('¿Estás seguro de cancelar esta orden?')) return;
    try {
      await api.delete(`/orders/${orderId}`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      setError('Error al cancelar la orden.');
    }
  };

  const handleConfirmOrder = async (orderId) => {
    if (!window.confirm('¿Estás seguro de confirmar esta orden?')) return;
    try {
      await api.post(`/orders/${orderId}/confirm`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      setError('Error al confirmar la orden.');
    }
  };

  const renderCreateOrderButton = () => {
    if (user && user.role === 'cliente') {
      return (
        <div className="mb-6 text-right">
          <button
            onClick={() => navigate('/orders/new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-semibold transition"
          >
            Crear Orden
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto px-6 py-10">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Órdenes</h2>

      {loading && <p className="text-gray-600">Cargando órdenes...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {renderCreateOrderButton()}

      {orders.length > 0 ? (
        <table className="w-full table-auto border border-gray-300 rounded-lg shadow-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-4 text-left">ID</th>
              <th className="py-3 px-4 text-left">Cliente</th>
              <th className="py-3 px-4 text-left">Total</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Fecha de Creación</th>
              <th className="py-3 px-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">{order.id}</td>
                <td className="py-3 px-4">{order.client_id}</td>
                <td className="py-3 px-4">${order.total}</td>
                <td className="py-3 px-4">{order.status}</td>
                <td className="py-3 px-4">{new Date(order.created_at).toLocaleString()}</td>
                <td className="py-3 px-4">
                  <Link to={`/orders/${order.id}`} className="text-blue-600 hover:underline">
                    Ver Detalle
                  </Link>
                  {order.status === 'pending' && (
                    <div className="space-x-2 mt-2">
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition"
                      >
                        Cancelar
                      </button>
                      {user && (user.role === 'admin' || user.role === 'almacenista') && (
                        <button
                          onClick={() => handleConfirmOrder(order.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition"
                        >
                          Confirmar
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p>No hay órdenes para mostrar.</p>
      )}
    </div>
  );
};

export default Orders;
