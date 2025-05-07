import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function ComparePrice() {
  const { id } = useParams();
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        // 1) Recupera tu token JWT (asegúrate de que ya lo guardaste al hacer login)
        const token = localStorage.getItem("token"); 
        if (!token) throw new Error("No hay token de autenticación. Por favor ingresa.");
  
        // 2) Llama al backend incluyendo la cabecera Authorization
        const response = await fetch(
          `http://localhost:8000/products/${id}/scrape-price`,
          {
            headers: {
              "Accept": "application/json",
              "Authorization": `Bearer ${token}`
            }
          }
        );
  
        // 3) Manejo de errores HTTP
        if (response.status === 401) {
          throw new Error("No autenticado. Por favor inicia sesión de nuevo.");
        }
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error ${response.status}: ${text}`);
        }
  
        // 4) Parsea el JSON y guarda el resultado
        const data = await response.json();
        setComparison(data);
  
      } catch (err) {
        setError(err.message);
  
      } finally {
        setLoading(false);
      }
    };
  
    fetchComparison();
  }, [id]);  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-blue-500 text-lg font-semibold animate-pulse">
          Cargando comparación de precios…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-600 font-semibold">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 mt-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Comparación de Precio
      </h2>

      <div className="space-y-2">
        <p className="text-gray-700">
          <span className="font-semibold">Producto:</span> {comparison.producto}
        </p>
        <p className="text-gray-700">
          <span className="font-semibold">Precio interno:</span> $
          {comparison.precio_interno}
        </p>

        {comparison.precio_rebaja ? (
          <>
            <p className="text-gray-700">
              <span className="font-semibold">
                Precio en La Rebaja Virtual:
              </span>{" "}
              {comparison.precio_rebaja}
            </p>
            <a
              href={comparison.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
            >
              Ver en La Rebaja
            </a>
          </>
        ) : (
          <p className="text-yellow-600 font-medium mt-2">
            {comparison.message || "Producto no encontrado en La Rebaja Virtual."}
          </p>
        )}
      </div>

      <div className="mt-6">
        <Link
          to={`/products/${id}`}
          className="inline-block bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-md transition"
        >
          ← Volver a detalles
        </Link>
      </div>
    </div>
);
}
