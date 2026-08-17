// src/api/api.js
import axios from 'axios';

const API_BASE_URL ='http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 (unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---- API functions ----
export const login = (username, password) => {
  return api.post('/login', { username, password });
};

export const getSetup = () => {
  return api.get('/setup');
};

export const updateParticipantOrder = (setupId, rooms) => {
  return api.put('/participants/order', { setup_id: setupId, rooms });
};

export default api;