// src/components/UserManagement.js
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

  // Obtenemos el token del localStorage y lo memorizamos para evitar recrearlo en cada render
  const token = useMemo(() => localStorage.getItem('token'), []);
  const config = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  // Función para obtener la lista de usuarios
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

  // Manejar el registro o la actualización de usuario
  const handleRegisterOrUpdate = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        // Actualizar usuario existente
        await axios.put(`http://localhost:8000/users/${editingUser.id}`, { username, password, role }, config);
        setMessage('Usuario actualizado exitosamente.');
      } else {
        // Registrar nuevo usuario
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
      setError('Error al procesar la solicitud. Asegúrate de que solo el admin pueda realizar esta acción.');
      setMessage('');
    }
  };

  // Manejar la eliminación de usuario
  const handleDeleteUser = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este usuario?')) return;
    try {
      await axios.delete(`http://localhost:8000/users/${id}`, config);
      setMessage('Usuario eliminado exitosamente.');
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el usuario.');
    }
  };

  // Cargar datos de usuario para edición
  const handleEditUser = (user) => {
    setUsername(user.username);
    setRole(user.role);
    setEditingUser(user);
    setMessage('');
    setError('');
  };

  // Renderizado condicional: si se está editando un usuario, mostrar el formulario de edición/registro
  const renderForm = () => {
    return (
      <div style={{ border: '1px solid #ccc', padding: '15px', marginBottom: '20px' }}>
        <h2>{editingUser ? 'Actualizar Usuario' : 'Registrar Usuario'}</h2>
        <form onSubmit={handleRegisterOrUpdate}>
          <div>
            <label>Usuario:</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Contraseña:</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Rol:</label>
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="cliente">Cliente</option>
              <option value="almacenista">Almacenista</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit">{editingUser ? 'Actualizar' : 'Registrar'}</button>
          {editingUser && <button type="button" onClick={() => setEditingUser(null)}>Cancelar Edición</button>}
        </form>
      </div>
    );
  };

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}
      
      {renderForm()}
      
      <h2>Lista de Usuarios</h2>
      <table border="1" cellPadding="8" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Rol</th>
            <th>EPS</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>{user.eps || 'Sin EPS asignada'}</td>
              <td>
                <button onClick={() => handleEditUser(user)}>Editar</button>
                <button onClick={() => handleDeleteUser(user.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserManagement;
