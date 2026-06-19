import axios from 'axios';

// Main backend runs on port 8000 (see backend/README.md)
export const DEFAULT_API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const LEGACY_API_URL = 'http://localhost:8001/api/v1';

export const getApiUrl = () => {
  const stored = localStorage.getItem('admin_api_url');
  if (!stored || stored === LEGACY_API_URL) {
    if (stored === LEGACY_API_URL) {
      localStorage.setItem('admin_api_url', DEFAULT_API_URL);
    }
    return DEFAULT_API_URL;
  }
  return stored;
};

export const getAuthToken = () => localStorage.getItem('admin_token');

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('admin_token', token);
  } else {
    localStorage.removeItem('admin_token');
  }
};

export const getAdminUser = () => {
  const user = localStorage.getItem('admin_user');
  return user ? JSON.parse(user) : null;
};

export const setAdminUser = (user: any) => {
  if (user) {
    localStorage.setItem('admin_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('admin_user');
  }
};

// Create axios instance
export const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT Token
api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiUrl(); // refresh base URL dynamically
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session resets (e.g. 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and user
      setAuthToken(null);
      setAdminUser(null);
      // Redirect to login page by reloading or triggering custom auth event
      window.dispatchEvent(new Event('auth-session-expired'));
    }
    return Promise.reject(error);
  }
);
