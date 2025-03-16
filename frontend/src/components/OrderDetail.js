// src/components/OrderDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const fetchOrderDetail = async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Error al obtener el detalle de la orden.');
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!order) return <p>Cargando detalles...</p>;

  return (
    <div>
      <h2>Detalle de la Orden</h2>
      <p><strong>ID:</strong> {order.id}</p>
      <p><strong>Cliente ID:</strong> {order.client_id}</p>
      <p><strong>Total:</strong> ${order.total}</p>
      <p><strong>Status:</strong> {order.status}</p>
      <p>
        <strong>Fecha de Creación:</strong> {new Date(order.created_at).toLocaleString()}
      </p>
      <h3>Ítems de la Orden</h3>
      {order.items && order.items.length > 0 ? (
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>Producto ID</th>
              <th>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={index}>
                <td>{item.product_id}</td>
                <td>{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No hay ítems en esta orden.</p>
      )}
      <Link to="/orders">
        <button>Volver a Órdenes</button>
      </Link>
    </div>
  );
};

export default OrderDetail;
