import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const handleCompareClick = () => {
    navigate(`/products/${product.id}/compare`);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);

        if (response.data.image_filename) {
          const imageRes = await api.get(`/imagen/${response.data.image_filename}`);
          setImageUrl(imageRes.data.image_url);
        }
      } catch (err) {
        console.error(err);
        setError('Error al obtener detalles del producto.');
      }
    };

    fetchProduct();
  }, [id]);

  if (error) return <p className="text-red-600 text-center">{error}</p>;
  if (!product) return <p className="text-center">Cargando...</p>;

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-lg mt-10">
      <h2 className="text-2xl font-bold text-violet-700 mb-4">Detalle del Producto</h2>

      <p className="mb-2"><strong>Nombre:</strong> {product.name}</p>
      <p className="mb-2"><strong>Stock:</strong> {product.stock}</p>
      <p className="mb-4"><strong>Precio:</strong> ${product.price}</p>

      {imageUrl && (
        <div className="mb-4">
          <strong>Imagen:</strong><br />
          <img src={imageUrl} alt={product.name} className="w-full max-w-md rounded" />
        </div>
      )}

      {/* Botón elegante con Tailwind */}
      <button
        onClick={handleCompareClick}
        className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-md transition-all duration-200"
      >
        🔍 Comparar precio externo
      </button>

      <Link to="/products">
        <button className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded">
          Volver a Productos
        </button>
      </Link>
    </div>
  );
};

export default ProductDetail;
