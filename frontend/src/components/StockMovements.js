// src/components/StockMovements.js
import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../AuthContext';

const StockMovements = () => {
  const [movements, setMovements] = useState([]);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const response = await api.get('/stock_movements/');
        setMovements(response.data);
      } catch (err) {
        console.error(err);
        setError('Error al obtener los movimientos de stock.');
      }
    };

    if (user && (user.role === 'admin' || user.role === 'almacenista')) {
      fetchMovements();
    }
  }, [user]);

  if (!user || (user.role !== 'admin' && user.role !== 'almacenista')) {
    return <p>No tienes acceso a esta sección.</p>;
  }

  return (
    <div>
      <h2>Movimientos de Stock</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table border="1" cellPadding="8" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Producto ID</th>
            <th>Cambio</th>
            <th>Descripción</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {movements.map(mov => (
            <tr key={mov.id}>
              <td>{mov.id}</td>
              <td>{mov.product_id}</td>
              <td>{mov.change}</td>
              <td>{mov.description}</td>
              <td>{new Date(mov.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockMovements;