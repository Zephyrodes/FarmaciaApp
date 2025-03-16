// src/components/OrderForm.js
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const OrderForm = () => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products/');
        setProducts(response.data);
      } catch (err) {
        console.error(err);
        setError('Error al obtener la lista de productos.');
      }
    };
    fetchProducts();
  }, []);

  const handleQuantityChange = (productId, quantity) => {
    setSelectedProducts((prev) => {
      const updated = prev.filter((item) => item.product_id !== productId);
      if (quantity > 0) {
        updated.push({ product_id: productId, quantity });
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedProducts.length === 0) {
      setError('Debes seleccionar al menos un producto.');
      return;
    }
    try {
      await api.post('/orders/', { items: selectedProducts });
      navigate('/orders');
    } catch (err) {
      console.error(err);
      setError('Error al crear la orden.');
    }
  };

  return (
    <div>
      <h2>Crear Orden</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Cantidad</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.stock}</td>
                <td>${product.price}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    max={product.stock}
                    onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value, 10) || 0)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="submit">Confirmar Orden</button>
      </form>
    </div>
  );
};

export default OrderForm;
