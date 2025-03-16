// src/components/Products.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../AuthContext';

function Products() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

  // Función para obtener productos desde el backend
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products/');
      setProducts(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Error al obtener productos.');
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un producto
  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este producto?")) return;
    try {
      await api.delete(`/products/${id}`);
      fetchProducts();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el producto.');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div>
      <h2>Lista de Productos</h2>
      {loading && <p>Cargando productos...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Botón para crear nuevo producto, visible para admin/almacenista */}
      {user && (user.sub === 'admin' || user.sub === 'almacenista') && (
        <div style={{ marginBottom: '20px' }}>
          <Link to="/products/new">
            <button>Crear Nuevo Producto</button>
          </Link>
        </div>
      )}

      {products.length > 0 ? (
        <table border="1" cellPadding="8" cellSpacing="0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Stock</th>
              <th>Precio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(prod => (
              <tr key={prod.id}>
                <td>{prod.id}</td>
                <td>{prod.name}</td>
                <td>{prod.stock}</td>
                <td>{prod.price}</td>
                <td>
                  <Link to={`/products/${prod.id}`}>
                    <button>Ver Detalle</button>
                  </Link>
                  {user && (user.sub === 'admin' || user.sub === 'almacenista') && (
                    <>
                      <Link to={`/products/edit/${prod.id}`}>
                        <button>Editar</button>
                      </Link>
                      <button onClick={() => handleDelete(prod.id)}>Eliminar</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p>No hay productos disponibles.</p>
      )}
    </div>
  );
}

export default Products;
