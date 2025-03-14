import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axios.get('http://localhost:8000/orders/', config);
      setOrders(response.data);
    } catch (err) {
      console.error(err);
      setError('Error al obtener órdenes.');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div>
      <h2>Órdenes</h2>
      {error && <p style={{color: 'red'}}>{error}</p>}
      <ul>
        {orders.map(order => (
          <li key={order.id}>ID: {order.id} - Estado: {order.status} - Total: {order.total}</li>
        ))}
      </ul>
    </div>
  );
}

export default Orders;
