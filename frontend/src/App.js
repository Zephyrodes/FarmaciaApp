// src/App.js
import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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
import Cart from './components/Cart';
import ComparePrice from './components/ComparePrice';
import OrderConfirmation from './components/OrderConfirmation';
import { AuthContext } from './context/AuthContext';

const RequireAuth = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cart" element={<Cart />} />

      {/* Protegemos /products: solo usuarios con sesión (admin, almacenista, cliente) */}
      <Route
        path="/products"
        element={
          <RequireAuth allowedRoles={['admin', 'almacenista', 'cliente']}>
            <Products />
          </RequireAuth>
        }
      />

      {/* Cliente */}
      <Route
        path="/orders/new"
        element={
          <RequireAuth allowedRoles={['cliente']}>
            <OrderForm />
          </RequireAuth>
        }
      />

      {/* Confirmación de la orden */}
      <Route
        path="/order-confirmation"
        element={
          <RequireAuth allowedRoles={['cliente']}>
            <OrderConfirmation />
          </RequireAuth>
        }
      />

      {/* Detalle de producto editable/visible según roles */}
      <Route
        path="/products/:id"
        element={
          <RequireAuth allowedRoles={['admin', 'almacenista', 'cliente']}>
            <ProductDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/products/:id/compare"
        element={
          <RequireAuth allowedRoles={['admin', 'almacenista']}>
            <ComparePrice />
          </RequireAuth>
        }
      />
      <Route
        path="/products/edit/:id"
        element={
          <RequireAuth allowedRoles={['admin', 'almacenista']}>
            <ProductForm />
          </RequireAuth>
        }
      />
      <Route
        path="/products/new"
        element={
          <RequireAuth allowedRoles={['admin', 'almacenista']}>
            <ProductForm />
          </RequireAuth>
        }
      />

      {/* Admin */}
      <Route
        path="/users"
        element={
          <RequireAuth allowedRoles={['admin']}>
            <UserManagement />
          </RequireAuth>
        }
      />

      {/* EPS Management */}
      <Route
        path="/eps"
        element={
          <RequireAuth allowedRoles={['admin', 'almacenista']}>
            <EPSManagement />
          </RequireAuth>
        }
      />

      {/* Órdenes y finanzas */}
      <Route
        path="/orders"
        element={
          <RequireAuth allowedRoles={['admin', 'almacenista']}>
            <Orders />
          </RequireAuth>
        }
      />
      <Route
        path="/orders/:id"
        element={
          <RequireAuth allowedRoles={['admin', 'almacenista']}>
            <OrderDetail />
          </RequireAuth>
        }
      />
      <Route
        path="/finanzas"
        element={
          <RequireAuth allowedRoles={['admin']}>
            <FinancialMovements />
          </RequireAuth>
        }
      />
      <Route
        path="/stock"
        element={
          <RequireAuth allowedRoles={['admin']}>
            <StockMovements />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;