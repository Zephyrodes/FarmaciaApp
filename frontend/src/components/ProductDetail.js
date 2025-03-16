// src/components/ProductDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState('');

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (err) {
      console.error(err);
      setError('Error al obtener detalles del producto.');
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!product) return <p>Cargando...</p>;

  return (
    <div>
      <h2>Detalle del Producto</h2>
      <p><strong>Nombre:</strong> {product.name}</p>
      <p><strong>Stock:</strong> {product.stock}</p>
      <p><strong>Precio Original:</strong> {product.price}</p>
      {product.discounted_price && (
        <p><strong>Precio con Descuento:</strong> {product.discounted_price}</p>
      )}
      <Link to="/products">
        <button>Volver a Productos</button>
      </Link>
    </div>
  );
};

export default ProductDetail;
