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

  // Fetch EPS and users
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

  const handleEPSSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEPSId) {
        await axios.put(`http://localhost:8000/eps/${editingEPSId}`, { name: epsName, discount: parseFloat(discount) }, config);
        setMessage('EPS actualizada exitosamente.');
      } else {
        await axios.post('http://localhost:8000/eps/', { name: epsName, discount: parseFloat(discount) }, config);
        setMessage('EPS agregada exitosamente.');
      }
      setError('');
      setEPSName('');
      setDiscount('');
      setEditingEPSId(null);
      fetchEPS();
    } catch (err) {
      setError('Error al agregar/actualizar EPS.');
    }
  };

  const handleEditEPS = (eps) => {
    setEPSName(eps.name);
    setDiscount(eps.discount);
    setEditingEPSId(eps.id);
  };

  const handleDeleteEPS = async (epsId) => {
    try {
      await axios.delete(`http://localhost:8000/eps/${epsId}`, config);
      fetchEPS();
      setMessage('EPS eliminada exitosamente.');
    } catch (err) {
      setError('Error al eliminar EPS.');
    }
  };

  const handleAssignEPS = async () => {
    try {
      await axios.post('http://localhost:8000/assign_eps/', { user_id: selectedUser, eps_id: selectedEPS }, config);
      setMessage('EPS asignada correctamente.');
    } catch (err) {
      setError('Error al asignar EPS.');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h2 className="text-3xl font-bold text-violet-700 mb-4">Gestión de EPS</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="text-green-600 mb-4">{message}</p>}

      {/* Formulario de creación y edición */}
      <div className="bg-white p-6 shadow-md rounded-lg mb-10">
        <h3 className="text-xl font-semibold mb-4 text-violet-700">{editingEPSId ? 'Editar EPS' : 'Agregar Nueva EPS'}</h3>
        <form onSubmit={handleEPSSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block font-semibold text-gray-700">Nombre de EPS:</label>
              <input
                type="text"
                value={epsName}
                onChange={e => setEPSName(e.target.value)}
                required
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-gray-700">Descuento (%):</label>
              <input
                type="number"
                value={discount}
                onChange={e => setDiscount(e.target.value)}
                required
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-violet-600 text-white py-3 rounded-lg hover:bg-violet-700 transition mt-4"
            >
              {editingEPSId ? 'Actualizar EPS' : 'Agregar EPS'}
            </button>
            {editingEPSId && (
              <button
                type="button"
                onClick={() => setEditingEPSId(null)}
                className="w-full text-red-600 py-2 mt-2 hover:bg-red-100 rounded-lg transition"
              >
                Cancelar Edición
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabla de EPS */}
      <h3 className="text-2xl font-semibold mb-4 text-violet-700">Lista de EPS</h3>
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-violet-600 text-white">
            <tr>
              <th className="py-3 px-4">ID</th>
              <th className="py-3 px-4">Nombre</th>
              <th className="py-3 px-4">Descuento</th>
              <th className="py-3 px-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {epsList.map(eps => (
              <tr key={eps.id} className="hover:bg-gray-50">
                <td className="py-3 px-4">{eps.id}</td>
                <td className="py-3 px-4">{eps.name}</td>
                <td className="py-3 px-4">{eps.discount}%</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleEditEPS(eps)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteEPS(eps.id)}
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

      {/* Asignación de EPS */}
      <h3 className="text-2xl font-semibold mt-10 text-violet-700">Asignar EPS a Cliente</h3>
      <div className="space-y-4">
        <div>
          <label className="block font-semibold text-gray-700">Selecciona Usuario:</label>
          <select
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Seleccione...</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.username}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold text-gray-700">Selecciona EPS:</label>
          <select
            value={selectedEPS}
            onChange={e => setSelectedEPS(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">Seleccione...</option>
            {epsList.map(eps => (
              <option key={eps.id} value={eps.id}>{eps.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handleAssignEPS}
          className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded mt-4"
        >
          Asignar EPS
        </button>
      </div>
    </div>
  );
}

export default EPSManagement;
