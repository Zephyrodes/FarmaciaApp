// src/App.js
import React, { useContext } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import Products from './components/Products';
import ProductDetail from './components/ProductDetail';
import ProductForm from './components/ProductForm';
import EPSManagement from './components/EPSManagement';
import Orders from './components/Orders';
import OrderForm from './components/OrderForm';
import OrderDetail from './components/OrderDetail';
import FinancialMovements from './components/FinancialMovements';
import StockMovements from './components/StockMovements';
import { AuthContext } from './AuthContext';
import './App.css';

function App() {
  const { user, logout } = useContext(AuthContext);
  const isAdmin = user && user.role === 'admin';

  return (
    <div>
      <nav className="navbar">
        <div className="nav-left">
          <ul>
            <li><Link to="/">Inicio</Link></li>
            <li><Link to="/products">Productos</Link></li>
            <li><Link to="/orders">Órdenes</Link></li>
            {isAdmin && <li><Link to="/users-management">Gestión de Usuarios</Link></li>}
            {isAdmin && <li><Link to="/eps">Gestionar EPS</Link></li>}
            {isAdmin && <li><Link to="/financial_movements">Mov. Financieros</Link></li>}
            {(user && (user.role === 'admin' || user.role === 'almacenista')) && (
              <li><Link to="/stock_movements">Mov. de Stock</Link></li>
            )}
          </ul>
        </div>
        <div className="nav-right">
          <ul>
            {user ? (
              <>
                <li>Bienvenido, {user.sub}</li>
                <li><button onClick={logout}>Cerrar sesión</button></li>
              </>
            ) : (
              <li><Link to="/login">Iniciar Sesión</Link></li>
            )}
          </ul>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        {isAdmin && <Route path="/users-management" element={<UserManagement />} />}
        {isAdmin && <Route path="/eps" element={<EPSManagement />} />}
        <Route path="/products" element={<Products />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/edit/:id" element={<ProductForm />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/new" element={<OrderForm />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        {isAdmin && <Route path="/financial_movements" element={<FinancialMovements />} />}
        {(user && (user.role === 'admin' || user.role === 'almacenista')) && (
          <Route path="/stock_movements" element={<StockMovements />} />
        )}
      </Routes>
    </div>
  );
}

export default App;
