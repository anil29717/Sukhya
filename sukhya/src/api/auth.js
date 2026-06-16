import { apiFetch, saveTokens, clearTokens, getRefreshToken } from './client';

export const loginApi = async (email, password) => {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  await saveTokens(data.access_token, data.refresh_token);
  return data;
};

export const registerDoctorApi = (payload) =>
  apiFetch('/auth/register/doctor', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const logoutApi = async () => {
  const refreshToken = await getRefreshToken();
  await apiFetch('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  }).catch(() => {}); // ignore errors on logout
  await clearTokens();
};

export const forgotPasswordApi = (email) =>
  apiFetch('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

export const resetPasswordApi = (token, newPassword) =>
  apiFetch('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  });

export const getMeApi = () => apiFetch('/users/me');