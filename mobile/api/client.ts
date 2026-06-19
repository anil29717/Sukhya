import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { store } from '@/store/store';
import { setAuth, clearAuth } from '@/store/authSlice';
import { normalizeUser, UserResponse } from './types';
import { tokenStorage, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from './storage';

function resolveApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL ?? Constants.expoConfig?.extra?.apiUrl;
  if (envUrl) return envUrl.replace(/\/$/, '');

  if (Platform.OS === 'web') return 'http://localhost:8000/api/v1';

  const host =
    Constants.expoConfig?.hostUri?.split(':')[0] ??
    (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');
  return `http://${host}:8000/api/v1`;
}

export const API_URL = resolveApiUrl();

export const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(
  async (config) => {
    const token = await tokenStorage.getItem(ACCESS_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return client(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;
        await tokenStorage.setItem(ACCESS_TOKEN_KEY, access_token);
        if (newRefreshToken) {
          await tokenStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
        }

        const userRes = await client.get<UserResponse>('/users/me');
        store.dispatch(setAuth({ user: normalizeUser(userRes.data), token: access_token }));

        client.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        processQueue(null, access_token);
        return client(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await tokenStorage.removeItem(ACCESS_TOKEN_KEY);
        await tokenStorage.removeItem(REFRESH_TOKEN_KEY);
        store.dispatch(clearAuth());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
