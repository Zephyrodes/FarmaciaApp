import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cliente');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editingUser, setEditingUser] = useState(null); // Objeto con los datos a editar

  // Memorizar config para evitar recrearla en cada render
  const token = localStorage.getItem('token');
  const config = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/users/', config);
      setUsers(response.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Error al obtener la lista de usuarios.');
    }
  }, [config]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRegisterOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`http://localhost:8000/users/${editingUser.id}`, { username, password, role }, config);
        setMessage('Usuario actualizado exitosamente.');
      } else {
        await axios.post('http://localhost:8000/register', { username, password, role }, config);
        setMessage('Usuario registrado exitosamente.');
      }
      setError('');
      setUsername('');
      setPassword('');
      setRole('cliente');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError('Error al registrar/actualizar usuario.');
    }
  };

  const handleEditUser = (user) => {
    setUsername(user.username);
    setPassword('');
    setRole(user.role);
    setEditingUser(user);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await axios.delete(`http://localhost:8000/users/${userId}`, config);
      fetchUsers();
      setMessage('Usuario eliminado exitosamente.');
    } catch (err) {
      console.error(err);
      setError('Error al eliminar usuario.');
    }
  };

  const renderForm = () => (
    <div className="bg-white p-6 shadow-md rounded-lg mb-10">
      <h2 className="text-2xl font-semibold mb-4 text-violet-700">{editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}</h2>
      <form onSubmit={handleRegisterOrUpdate}>
        <div className="space-y-4">
          <div>
            <label className="block font-semibold text-gray-700">Usuario:</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-700">Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>
          <div>
            <label className="block font-semibold text-gray-700">Rol:</label>
            <select
              value={role}
              onChange={e => setRole(e.target.value)}
              className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="cliente">Cliente</option>
              <option value="almacenista">Almacenista</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 transition mt-4"
          >
            {editingUser ? 'Actualizar Usuario' : 'Registrar Usuario'}
          </button>
          {editingUser && (
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="w-full text-red-600 py-2 mt-2 hover:bg-red-100 rounded-lg transition"
            >
              Cancelar Edición
            </button>
          )}
        </div>
      </form>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="text-green-600 mb-4">{message}</p>}
      {renderForm()}

      <h2 className="text-2xl font-semibold text-violet-700 mb-4">Lista de Usuarios</h2>
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-violet-600 text-white">
            <tr>
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Usuario</th>
              <th className="py-3 px-4">Rol</th>
              <th className="py-3 px-4">EPS</th>
              <th className="py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">{user.id}</td>
                <td className="py-3 px-4">{user.username}</td>
                <td className="py-3 px-4 capitalize">{user.role}</td>
                <td className="py-3 px-4">{user.eps || 'N/A'}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition ml-2"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;