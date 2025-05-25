import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

function Home() {
  const { user, logout } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  const handleRedirect = (path) => {
    setDropdownOpen(false);
    navigate(path);
  };

  // Fetch all products to filter for search
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products/');
        setProducts(response.data);
      } catch (err) {
        console.error('Error fetching products:', err);
      }
    };
    fetchProducts();
  }, []);

  // Filter products as user types
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  // Scroll to the product card after clicking a search result
  const handleProductClick = (productId) => {
    navigate('/products');  // Navigate to the products page
    setTimeout(() => {
      const productElement = document.getElementById(`product-${productId}`);
      if (productElement) {
        productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  };

  return (
    <div className="bg-white text-gray-900">
      {/* Navbar visual */}
      <header className="flex justify-between items-center px-6 py-4 shadow bg-gradient-to-r from-blue-600 to-green-500 text-white relative">
        <div className="flex items-center gap-2">
          <span className="text-3xl">💊</span>
          <span className="font-bold text-lg">
            Insta<span className="text-yellow-300">Farma</span>
          </span>
        </div>
        {/* Search bar visible only for clients */}
        {user?.role === 'cliente' && (
          <input
            type="text"
            placeholder="¿Qué estás buscando?"
            value={searchQuery}
            onChange={handleSearch}
            className="rounded-full px-4 py-1 w-1/3 text-sm text-black focus:outline-none"
          />
        )}
        <div className="flex items-center gap-4 relative">
          
          <Link
            to="/cart"
            className="flex items-center space-x-1 text-sm cursor-pointer hover:text-gray-600"
          >
            <span role="img" aria-label="Carrito" className="text-lg">
              🛒
            </span>
            <span>Mi carrito</span>
          </Link>

          <span className="text-sm">📍 Bogotá</span>

          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="text-sm flex items-center gap-1 hover:underline"
              >
                👤 {user.sub} ▾
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-black shadow-lg rounded z-50 text-sm">
                  {user.role === 'admin' && (
                    <>
                      <button
                        onClick={() => handleRedirect('/users')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Gestión de Usuarios
                      </button>
                      <button
                        onClick={() => handleRedirect('/orders')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Gestión de Ordenes
                      </button>
                      <button
                        onClick={() => handleRedirect('/finanzas')}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100"
                      >
                        Finanzas
                      </button>
                    </>
                  )}
                  {(user.role === 'admin' || user.role === 'almacenista') && (
                    <button
                      onClick={() => handleRedirect('/stock')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100"
                    >
                      Movimientos de Stock
                    </button>
                  )}
                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600 border-t"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-black text-sm px-4 py-1 rounded-lg font-semibold transition">
                Iniciar sesión
              </button>
            </Link>
          )}
        </div>
      </header>

      {/* Hero destacado */}
      <section className="text-center py-20 px-6 md:px-24 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-white to-yellow-200 drop-shadow">
            Compra fácil, recibe rápido, <br /> vive mejor
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Medicamentos, cuidado personal y más... ¡a solo un clic!
          </p>
          {user && (
            <Link to="/products">
              <button className="bg-yellow-300 hover:bg-yellow-400 text-gray-900 font-bold px-6 py-3 rounded-lg text-lg shadow-lg transition transform hover:scale-105">
                Ver Ofertas Especiales
              </button>
            </Link>
          )}
        </div>
        <div className="mt-12">
          <img
            src="https://www.farmalisto.com.co/portals/0/banner-categoria-genericos-movil.jpg"
            alt="Promo"
            className="rounded-xl shadow-2xl w-full max-w-3xl mx-auto border-4 border-white"
          />
        </div>
      </section>

      {/* Display filtered products */}
      {user?.role === 'cliente' && filteredProducts.length > 0 && (
        <section className="py-10 px-6 bg-gray-50">
          <h2 className="text-3xl font-bold text-center mb-6">Resultados de Búsqueda</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div
                id={`product-${product.id}`}
                key={product.id}
                className="bg-white p-4 shadow rounded-xl hover:shadow-lg transition"
                onClick={() => handleProductClick(product.id)}
              >
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-40 object-contain mb-4 rounded"
                />
                <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
                <p className="text-purple-600 text-xl font-bold">${product.price}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Beneficios llamativos */}
      <section className="py-20 px-6 md:px-24 bg-white">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">¿Por qué elegirnos?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center max-w-6xl mx-auto">
          {[
            {
              icon: 'https://cdn-icons-png.flaticon.com/512/263/263115.png',
              title: 'Medicamentos confiables',
              text: 'Formulaciones certificadas de laboratorios reconocidos.'
            },
            {
              icon: 'https://cdn-icons-png.flaticon.com/512/2921/2921822.png',
              title: 'Compra sin complicaciones',
              text: 'Haz tus pedidos desde cualquier lugar en minutos.'
            },
            {
              icon: 'https://cdn-icons-png.flaticon.com/512/3205/3205215.png',
              title: 'Atención farmacéutica',
              text: 'Asesoría en línea por personal capacitado y confiable.'
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl shadow-md hover:shadow-xl transition transform hover:scale-105 bg-white"
            >
              <img src={item.icon} alt={item.title} className="w-20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-violet-600 mb-2">{item.title}</h3>
              <p className="text-gray-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Nueva sección intermedia */}
      <section className="bg-gradient-to-r from-green-100 to-blue-100 py-20 px-6 md:px-24 text-center">
        <h2 className="text-3xl font-bold mb-6 text-gray-700">Más de 1 millón de pedidos entregados</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Gracias a ti, somos la farmacia en línea más confiable del país. 
          Disfruta de entregas en tiempo récord, soporte humano y promociones exclusivas cada semana.
        </p>
      </section>

      {/* Sección de confianza */}
      <section className="py-20 px-6 md:px-24 flex flex-col md:flex-row gap-10 items-center bg-white">
        <div className="md:w-1/2 space-y-5">
          <h2 className="text-3xl font-bold text-gray-800">Tu bienestar en manos seguras</h2>
          <p className="text-gray-700 text-lg">
            Trabajamos con laboratorios certificados y entregamos medicamentos 100% originales.
          </p>
          <p className="text-gray-700 text-lg">
            Haz tus pedidos desde casa. Compra con tranquilidad, recibe con confianza.
          </p>
        </div>
        <div className="md:w-1/2">
          <img
            src="https://www.inside-pharmacy.com/wp-content/uploads/2020/03/atencion-farmacia-1024x683.jpg"
            alt="Atención"
            className="rounded-lg shadow-lg w-full border"
          />
        </div>
      </section>

      {/* Footer elegante */}
      <footer className="bg-violet-700 text-white py-6 text-center text-sm font-medium">
        InstaFarma © 2025 — Cuidando tu salud con pasión y compromiso.
      </footer>
    </div>
  );
}

export default Home;
