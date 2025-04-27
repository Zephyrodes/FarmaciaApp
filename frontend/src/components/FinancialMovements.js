import React, { useEffect, useState, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

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

  if (!user || user.role !== 'admin') return <p className="text-red-600 text-center mt-6">No tienes acceso a esta sección.</p>;

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold text-violet-700 mb-6">Movimientos Financieros</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-violet-600 text-white">
            <tr>
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Orden ID</th>
              <th className="py-3 px-4">Monto</th>
              <th className="py-3 px-4">Descripción</th>
              <th className="py-3 px-4">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {movements.map(mov => (
              <tr key={mov.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">{mov.id}</td>
                <td className="py-3 px-4">{mov.order_id}</td>
                <td className="py-3 px-4">${mov.amount}</td>
                <td className="py-3 px-4">{mov.description}</td>
                <td className="py-3 px-4">{new Date(mov.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FinancialMovements;
