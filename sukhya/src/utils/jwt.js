/**
 * Decode a JWT payload without verifying signature.
 * Only use client-side for reading role/exp — NEVER for auth decisions.
 */
export const decodeJWT = (token) => {
  try {
    const base64 = token.split('.')[1];
    const padded = base64.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const getTokenRole = (token) => {
  const payload = decodeJWT(token);
  return payload?.role ?? null; // 'patient' | 'doctor' | 'admin'
};

export const isTokenExpired = (token) => {
  const payload = decodeJWT(token);
  if (!payload?.exp) return true;
  return Date.now() >= payload.exp * 1000;
};