import axios from 'axios';

// Usar el nombre del servicio de Docker para el backend
const API_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar el token en cada petición
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
