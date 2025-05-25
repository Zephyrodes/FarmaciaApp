import React from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function OrderConfirmation() {
  const { state } = useLocation();
  const orderId = state?.orderId;

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded-lg shadow text-center">
      <h1 className="text-3xl font-bold mb-4">¡El estado de tu compra esta pediente espera una notificación!</h1>
      {orderId ? (
        <p className="text-lg">
          Tu orden <span className="font-semibold">#{orderId}</span> ha sido confirmada.
        </p>
      ) : (
        <p className="text-lg text-red-500">
          No se pudo identificar tu orden. 
        </p>
      )}
      <Link
        to="/"
        className="inline-block mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
