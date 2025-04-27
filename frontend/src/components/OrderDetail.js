import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

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
      setError('Error al obtener el detalle de la orden.');
    }
  }, [id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  if (error) return <p className="text-red-600 text-center mt-4">{error}</p>;
  if (!order) return <p className="text-center mt-4">Cargando detalles...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-violet-700 mb-4">Detalle de la Orden #{order.id}</h2>

      <div className="space-y-2 mb-6">
        <p><strong>Cliente ID:</strong> {order.client_id}</p>
        <p><strong>Total:</strong> ${order.total}</p>
        <p><strong>Status:</strong> <span className="capitalize">{order.status}</span></p>
        <p><strong>Fecha de creación:</strong> {new Date(order.created_at).toLocaleString()}</p>
      </div>

      <h3 className="text-lg font-semibold mb-2">🧾 Ítems de la Orden</h3>

      {order.items && order.items.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border shadow rounded bg-white">
            <thead className="bg-violet-600 text-white">
              <tr>
                <th className="py-2 px-4 text-left">Producto ID</th>
                <th className="py-2 px-4 text-left">Cantidad</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {order.items.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-2 px-4">{item.product_id}</td>
                  <td className="py-2 px-4">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No hay ítems en esta orden.</p>
      )}

      <div className="mt-6 text-right">
        <Link to="/orders">
          <button className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded">
            Volver a Órdenes
          </button>
        </Link>
      </div>
    </div>
  );
};

export default OrderDetail;
