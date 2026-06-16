import * as SecureStore from 'expo-secure-store';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'http://localhost:8000/api/v1';

const REQUEST_TIMEOUT_MS = 30000;

// ─── Token helpers ──────────────────────────────────────────────
export const getAccessToken = () => SecureStore.getItemAsync('access_token');
export const getRefreshToken = () => SecureStore.getItemAsync('refresh_token');

export const saveTokens = async (accessToken, refreshToken) => {
  await SecureStore.setItemAsync('access_token', accessToken);
  await SecureStore.setItemAsync('refresh_token', refreshToken);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync('access_token');
  await SecureStore.deleteItemAsync('refresh_token');
};

// ─── Token refresh ──────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

const refreshAccessToken = async () => {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) throw new Error('Refresh failed');

    const data = await res.json();
    await saveTokens(data.access_token, data.refresh_token);
    processQueue(null, data.access_token);
    return data.access_token;
  } catch (err) {
    processQueue(err, null);
    await clearTokens();
    throw err;
  } finally {
    isRefreshing = false;
  }
};

const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw { code: 'TIMEOUT', message: 'Request timed out. Please try again.' };
    }
    if (err.code === 'TIMEOUT') throw err;
    throw { code: 'NETWORK', message: 'No internet connection. Please check your connection and try again.' };
  } finally {
    clearTimeout(timeoutId);
  }
};

// ─── Main fetch wrapper ─────────────────────────────────────────
export const apiFetch = async (path, options = {}) => {
  let token = await getAccessToken();

  const makeRequest = async (accessToken) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    // Don't set Content-Type for multipart (let fetch set boundary)
    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    return fetchWithTimeout(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  };

  let res = await makeRequest(token);

  // Auto-refresh on 401
  if (res.status === 401 && token) {
    try {
      const newToken = await refreshAccessToken();
      res = await makeRequest(newToken);
    } catch {
      throw { code: 401, message: 'Session expired. Please log in again.' };
    }
  }

  // Handle errors
  if (!res.ok) {
    let errorData;
    try {
      errorData = await res.json();
    } catch {
      errorData = { detail: 'Something went wrong.' };
    }
    throw {
      code: res.status,
      message: typeof errorData.detail === 'string'
        ? errorData.detail
        : 'Validation error. Please check your inputs.',
      detail: errorData.detail,
    };
  }

  // Return null for 204 No Content
  if (res.status === 204) return null;

  return res.json();
};

export const apiJson = apiFetch;
