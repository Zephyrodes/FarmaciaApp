// src/components/ProductForm.js

import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import api, { getUploadUrl } from '../services/api';
import axios from 'axios';

const ConfirmationModal = ({ mensaje, producto_similar, onConfirm, onCancel }) => {
  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md">
        <h3 className="text-xl font-semibold mb-4 text-red-600">⚠ Atención</h3>
        <p className="mb-4">{mensaje}</p>
        <p className="mb-6">
          Producto parecido: <strong>{producto_similar}</strong>
        </p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Sí, crear de todas formas
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    stock: '',
    price: '',
    image_filename: '',
  });
  const [error, setError] = useState('');
  const [confirmacion, setConfirmacion] = useState(null);

  const fetchProduct = useCallback(async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setFormData({
        name: response.name,
        stock: response.stock,
        price: response.price,
        image_filename: response.image_filename || '',
      });
    } catch {
      setError('Error al cargar el producto para editar.');
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchProduct();
  }, [id, fetchProduct]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const uploadUrl = await getUploadUrl(file.name, file.type);
      await axios.put(uploadUrl, file, {
        headers: { 'Content-Type': file.type },
      });
      setFormData(prev => ({ ...prev, image_filename: file.name }));
    } catch {
      setError('Error al subir la imagen.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setConfirmacion(null);
  
    const baseEndpoint = id ? `/products/${id}` : '/products/';
    const endpoint = confirmacion
      ? `${baseEndpoint}?confirmado=true`
      : baseEndpoint;
    const method = id ? 'put' : 'post';
  
    try {
      const res = await api[method](endpoint, formData);
      // (por si el backend devolviera 200 con confirmación en el body)
      if (res.data.confirmacion_requerida) {
        setConfirmacion({
          mensaje: res.data.mensaje,
          producto_similar: res.data.producto_similar
        });
        return;
      }
      // creación exitosa
      navigate('/products');
    } catch (err) {
      // Manejo del 409 real desde el backend
      if (err.response?.status === 409 && err.response.data.confirmacion_requerida) {
        setConfirmacion({
          mensaje: err.response.data.mensaje,
          producto_similar: err.response.data.producto_similar
        });
        return;
      }
      setError('Error al guardar el producto.');
      console.error('Error:', err);
    }
  };
  
  const handleConfirmYes = () => {
    // Llamamos de nuevo al backend con "?confirmado=true"
    (async () => {
      try {
        const confirmEndpoint = id
          ? `/products/${id}?confirmado=true`
          : '/products/?confirmado=true';
        const confirmMethod = id ? 'put' : 'post';
  
        await api[confirmMethod](confirmEndpoint, formData);
        navigate('/products');
      } catch (err) {
        setError('Error al guardar el producto con confirmación.');
        console.error('Error:', err);
      } finally {
        // Cerramos el modal
        setConfirmacion(null);
      }
    })();
  };
  
  const handleConfirmNo = () => {
    setConfirmacion(null);  // Cierra el modal si no se confirma
  };
  
  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg mt-10">
      <h2 className="text-2xl font-bold text-violet-700 mb-6">
        {id ? 'Editar Producto' : 'Crear Producto'}
      </h2>
  
      {error && <p className="text-red-600 mb-4">{error}</p>}
  
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold">Nombre:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded-md"
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Stock:</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded-md"
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Precio:</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            required
            className="w-full border px-3 py-2 rounded-md"
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold">Imagen del producto:</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full"
          />
        </div>
        <button
          id="product-form-submit"
          type="submit"
          className="w-full bg-violet-600 text-white py-2 rounded hover:bg-violet-700"
        >
          {id ? 'Actualizar' : 'Crear'}
        </button>
      </form>
  
      {confirmacion && (
        <ConfirmationModal
          mensaje={confirmacion.mensaje}
          producto_similar={confirmacion.producto_similar}
          onConfirm={handleConfirmYes}
          onCancel={handleConfirmNo}
        />
      )}
    </div>
  );
};

export default ProductForm;
