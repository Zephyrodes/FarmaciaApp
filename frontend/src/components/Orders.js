// src/components/Orders.js
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../AuthContext';

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
        <div style={{ marginBottom: '20px' }}>
          <button onClick={() => navigate('/orders/new')}>Crear Orden</button>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h2>Órdenes</h2>
      {loading && <p>Cargando órdenes...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {renderCreateOrderButton()}
      {orders.length > 0 ? (
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Status</th>
              <th>Fecha de Creación</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>{order.client_id}</td>
                <td>${order.total}</td>
                <td>{order.status}</td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
                <td>
                  <Link to={`/orders/${order.id}`}>
                    <button>Ver Detalle</button>
                  </Link>
                  {order.status === 'pending' && (
                    <>
                      <button onClick={() => handleCancelOrder(order.id)}>Cancelar</button>
                      {user && (user.role === 'admin' || user.role === 'almacenista') && (
                        <button onClick={() => handleConfirmOrder(order.id)}>Confirmar</button>
                      )}
                    </>
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
