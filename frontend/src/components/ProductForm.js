// src/components/ProductForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const ProductForm = () => {
  const { id } = useParams(); // undefined para crear, y un valor para editar
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    stock: '',
    price: '',
  });
  const [error, setError] = useState('');

  // Si estamos en modo edición, carga el producto
  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setFormData({
        name: response.data.name,
        stock: response.data.stock,
        price: response.data.price,
      });
    } catch (err) {
      console.error(err);
      setError('Error al cargar el producto.');
    }
  };

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (id) {
        // Modo edición
        await api.put(`/products/${id}`, formData);
      } else {
        // Modo creación
        await api.post('/products/', formData);
      }
      navigate('/products');
    } catch (err) {
      console.error(err);
      setError('Error al guardar el producto.');
    }
  };

  return (
    <div>
      <h2>{id ? 'Editar Producto' : 'Crear Producto'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Stock:</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Precio:</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">{id ? 'Actualizar' : 'Crear'}</button>
      </form>
    </div>
  );
};

export default ProductForm;
