import axios from 'axios';
import { getAccessToken } from '../contexts/AuthContext';

const API_BASE_URL = '/api';

/**
 * Singleton API client con interceptors centralizados.
 * UNA SOLA instancia para toda la aplicación.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ==========================================
// REQUEST INTERCEPTORS
// ==========================================

// JWT token interceptor — obtiene el token desde la variable en memoria
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================================
// RESPONSE INTERCEPTORS
// ==========================================

// Error handler interceptor — UNA SOLA VEZ
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Manejar 401 Unauthorized — token expirado o inválido
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    // Aceptar 204 No Content como respuesta exitosa
    if (error.response && error.response.status === 204) {
      return Promise.resolve(error.response);
    }

    if (error.response) {
      // El servidor respondió con un código de error
      const apiError = error.response.data;
      return Promise.reject({
        statusCode: apiError.statusCode || error.response.status,
        message: apiError.message || 'Error del servidor',
        errors: apiError.errors,
        timestamp: apiError.timestamp,
      });
    } else if (error.request) {
      // La solicitud fue hecha pero no se recibió respuesta
      return Promise.reject({
        statusCode: 0,
        message: 'Error de conexión. Por favor, verifica tu conexión a internet.',
        timestamp: new Date().toISOString(),
      });
    } else {
      // Algo pasó al configurar la solicitud
      return Promise.reject({
        statusCode: 0,
        message: error.message || 'Error desconocido',
        timestamp: new Date().toISOString(),
      });
    }
  }
);
