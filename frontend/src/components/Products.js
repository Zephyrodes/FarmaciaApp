// src/components/Products.js
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import GoToHomeButton from './GoToHomeButton'; 

function Products() {
  const [products, setProducts] = useState([]);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { user } = useContext(AuthContext);
  const { addToCart } = useCart();

  const isAdmin       = user?.sub === 'admin';
  const isAlmacenista = user?.sub === 'almacenista';
  const isGestor      = isAdmin || isAlmacenista;

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data: rawProducts } = await api.get('/products/');
        const productsWithImages = await Promise.all(
          rawProducts.map(async (prod) => {
            if (prod.image_filename) {
              try {
                const { data: imgData } = await api.get(`/imagen/${prod.image_filename}`);
                return { ...prod, image_url: imgData.image_url };
              } catch (err) {
                console.error('Error al obtener imagen:', err);
                return { ...prod, image_url: 'https://via.placeholder.com/200x150' };
              }
            }
            return { ...prod, image_url: 'https://via.placeholder.com/200x150' };
          })
        );
        setProducts(productsWithImages);
        setError('');
      } catch (err) {
        console.error(err);
        setError('Error al obtener productos.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el producto.');
    }
  };

  return (
    <div className="px-6 py-10 bg-gray-50 min-h-screen">
      {/* Botón Regresar a Home */}
      <GoToHomeButton />
      <h2 className="text-3xl font-bold mb-6 text-violet-700">
        {isGestor ? 'Gestión de Productos' : 'Nuestros Productos Disponibles'}
      </h2>

      {loading && <p className="text-gray-600 mb-4">Cargando productos...</p>}
      {error   && <p className="text-red-600 mb-4">{error}</p>}

      {isGestor ? (
        <>
          <div className="mb-6">
            <Link to="/products/new">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition">
                Crear Nuevo Producto
              </button>
            </Link>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((prod) => (
                <tr key={prod.id}>
                  <td>{prod.name}</td>
                  <td>${prod.price}</td>
                  <td>{prod.stock}</td>
                  <td className="space-x-2">
                    <Link to={`/products/${prod.id}`}>
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded">
                        Ver Detalles
                      </button>
                    </Link>
                    <Link to={`/products/edit/${prod.id}`}>
                      <button className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1 rounded">
                        Editar
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(prod.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products
            .filter((p) => p.stock > 0)
            .map((product) => (
              <div
                key={product.id}
                className="bg-white p-4 shadow rounded-xl hover:shadow-lg transition"
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-40 object-contain mb-4 rounded"
                />
                <h3 className="text-lg font-semibold text-gray-800">
                  {product.name}
                </h3>
                <p className="text-purple-600 text-xl font-bold">
                  ${product.price}
                </p>
                {user?.role === 'cliente' && (
                  <button
                    onClick={() => addToCart(product)}
                    className="mt-3 w-full bg-violet-600 hover:bg-violet-700 text-white py-2 rounded"
                  >
                    Añadir al carrito
                  </button>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default Products;
