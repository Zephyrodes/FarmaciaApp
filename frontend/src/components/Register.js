import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cliente');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      const response = await axios.post('http://localhost:8000/register', { username, password, role }, config);
      setMessage(response.data.message);
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError('Error en el registro. Recuerda que solo el admin puede registrar nuevos usuarios.');
    }
  };

  return (
    <div>
      <h2>Registrar Usuario</h2>
      {error && <p style={{color: 'red'}}>{error}</p>}
      {message && <p style={{color: 'green'}}>{message}</p>}
      <form onSubmit={handleRegister}>
        <div>
          <label>Usuario:</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div>
          <label>Contraseña:</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </div>
        <div>
          <label>Rol:</label>
          <select value={role} onChange={e => setRole(e.target.value)}>
            <option value="cliente">Cliente</option>
            <option value="almacenista">Almacenista</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit">Registrar</button>
      </form>
    </div>
  );
}

export default Register;
