import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

function EPSManagement() {
  const [epsList, setEPSList] = useState([]);
  const [users, setUsers] = useState([]);
  const [epsName, setEPSName] = useState('');
  const [discount, setDiscount] = useState('');
  const [editingEPSId, setEditingEPSId] = useState(null);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedEPS, setSelectedEPS] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const config = useMemo(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  // Memorizar las funciones para obtener datos
  const fetchEPS = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/eps/', config);
      setEPSList(response.data);
    } catch (err) {
      setError('Error al obtener EPS.');
    }
  }, [config]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:8000/users/', config);
      const clients = response.data.filter(user => user.role === 'cliente');
      setUsers(clients);
    } catch (err) {
      setError('Error al obtener la lista de usuarios.');
    }
  }, [config]);

  useEffect(() => {
    fetchEPS();
    fetchUsers();
  }, [fetchEPS, fetchUsers]);

  // Resto del código para agregar, editar, eliminar y asignar EPS...
  
  // Manejar creación y edición de EPS
  const handleEPSSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEPSId) {
        await axios.put(`http://localhost:8000/eps/${editingEPSId}`, { name: epsName, discount: parseFloat(discount) }, config);
        setMessage('EPS actualizada exitosamente.');
      } else {
        await axios.post('http://localhost:8000/eps/', { name: epsName, discount: parseFloat(discount) }, config);
        setMessage('EPS creada exitosamente.');
      }
      setError('');
      setEPSName('');
      setDiscount('');
      setEditingEPSId(null);
      fetchEPS();
    } catch (err) {
      setError('Error al procesar la solicitud.');
    }
  };

  // Manejar eliminación de EPS
  const handleDeleteEPS = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta EPS?')) return;
    try {
      await axios.delete(`http://localhost:8000/eps/${id}`, config);
      setMessage('EPS eliminada exitosamente.');
      fetchEPS();
    } catch (err) {
      setError('Error al eliminar la EPS.');
    }
  };

  // Cargar datos de EPS para edición
  const handleEditEPS = (eps) => {
    setEPSName(eps.name);
    setDiscount(eps.discount);
    setEditingEPSId(eps.id);
    setMessage('');
    setError('');
  };

  // Manejar asignación de EPS a cliente
  const handleAssignEPS = async () => {
    if (!selectedUser || !selectedEPS) {
      setError('Selecciona un usuario y una EPS.');
      return;
    }
    try {
      await axios.post(
        'http://localhost:8000/assign_eps/',
        { user_id: parseInt(selectedUser, 10), eps_id: parseInt(selectedEPS, 10) },
        config
      );
      setMessage('EPS asignada correctamente.');
      setError('');
    } catch (err) {
      setError('Error al asignar EPS.');
    }
  };

  return (
    <div>
      <h2>Gestionar EPS</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <h3>{editingEPSId ? 'Actualizar EPS' : 'Agregar Nueva EPS'}</h3>
      <form onSubmit={handleEPSSubmit}>
        <div>
          <label>Nombre de EPS:</label>
          <input type="text" value={epsName} onChange={e => setEPSName(e.target.value)} required />
        </div>
        <div>
          <label>Descuento (%):</label>
          <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} required />
        </div>
        <button type="submit">{editingEPSId ? 'Actualizar' : 'Agregar'}</button>
        {editingEPSId && <button onClick={() => setEditingEPSId(null)}>Cancelar</button>}
      </form>

      <h3>Lista de EPS</h3>
      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descuento</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {epsList.map(eps => (
            <tr key={eps.id}>
              <td>{eps.id}</td>
              <td>{eps.name}</td>
              <td>{eps.discount}%</td>
              <td>
                <button onClick={() => handleEditEPS(eps)}>Editar</button>
                <button onClick={() => handleDeleteEPS(eps.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Asignar EPS a Cliente</h3>
      <div>
        <label>Selecciona Usuario:</label>
        <select onChange={e => setSelectedUser(e.target.value)}>
          <option value="">Seleccione...</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>{user.username}</option>
          ))}
        </select>
      </div>
      <div>
        <label>Selecciona EPS:</label>
        <select onChange={e => setSelectedEPS(e.target.value)}>
          <option value="">Seleccione...</option>
          {epsList.map(eps => (
            <option key={eps.id} value={eps.id}>{eps.name}</option>
          ))}
        </select>
      </div>
      <button onClick={handleAssignEPS}>Asignar EPS</button>
    </div>
  );
}

export default EPSManagement;
