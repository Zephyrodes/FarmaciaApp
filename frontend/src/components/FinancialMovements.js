// src/components/FinancialMovements.js
import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../AuthContext';

const FinancialMovements = () => {
  const [movements, setMovements] = useState([]);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchMovements = async () => {
      try {
        const response = await api.get('/financial_movements/');
        setMovements(response.data);
      } catch (err) {
        console.error(err);
        setError('Error al obtener los movimientos financieros.');
      }
    };

    if (user && user.role === 'admin') {
      fetchMovements();
    }
  }, [user]);

  if (!user || user.role !== 'admin') return <p>No tienes acceso a esta sección.</p>;

  return (
    <div>
      <h2>Movimientos Financieros</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table border="1" cellPadding="8" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Orden ID</th>
            <th>Monto</th>
            <th>Descripción</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {movements.map(mov => (
            <tr key={mov.id}>
              <td>{mov.id}</td>
              <td>{mov.order_id}</td>
              <td>${mov.amount}</td>
              <td>{mov.description}</td>
              <td>{new Date(mov.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FinancialMovements;
