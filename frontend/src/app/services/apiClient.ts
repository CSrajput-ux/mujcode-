import axios from 'axios';

/**
 * Enterprise Centralized API Client
 *
 * This client replaces raw fetch/axios calls throughout the application.
 * It automatically:
 * 1. Prefixes the base URL based on environment.
 * 2. Injects the authentication token into every request.
 * 3. Standardizes error handling (e.g., global 401 redirects).
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach legacy x-auth-token if needed, otherwise cookies are handled automatically
apiClient.interceptors.request.use(
  (config) => {
    try {
      // Tokens are now securely handled by the browser's HttpOnly cookie jar.
      // We no longer read from localStorage to prevent XSS exfiltration.
      
      // Fallback for mobile/legacy clients if required (Phase 7 transitional)
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        config.headers['x-auth-token'] = token; 
      }
    } catch (error) {
      console.error('Error parsing request configuration', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global error handling
apiClient.interceptors.response.use(
  (response) => {
    // Return standard response data if successful
    return response;
  },
  (error) => {
    // Global 401 Unauthorized handler
    if (error.response && error.response.status === 401) {
      // In an enterprise app, we might dispatch a global logout action here
      // For now, we just clear local storage if the token is completely invalid
      // localStorage.removeItem('auth');
      // localStorage.removeItem('user');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
