import { client } from './client';
import { normalizeUser, PatientResponse, TokenResponse, UserProfile, UserResponse } from './types';

export async function login(email: string, password: string): Promise<{
  tokens: TokenResponse;
  user: UserProfile;
  patient: PatientResponse | null;
}> {
  const { data: tokens } = await client.post<TokenResponse>('/auth/login', { email, password });
  client.defaults.headers.common.Authorization = `Bearer ${tokens.access_token}`;

  const { data: userRaw } = await client.get<UserResponse>('/users/me');
  const user = normalizeUser(userRaw);

  let patient: PatientResponse | null = null;
  if (user.role === 'patient') {
    const { data } = await client.get<PatientResponse>('/patients/me');
    patient = data;
  }

  return { tokens, user, patient };
}

export async function registerPatient(payload: {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}): Promise<UserResponse> {
  const { data } = await client.post<UserResponse>('/auth/register/patient', payload);
  return data;
}

export async function fetchCurrentUser(): Promise<UserProfile> {
  const { data } = await client.get<UserResponse>('/users/me');
  return normalizeUser(data);
}

export async function requestPasswordReset(email: string): Promise<void> {
  await client.post('/auth/password-reset/request', { email });
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    await client.post('/auth/logout', { refresh_token: refreshToken });
  } catch {
    // ignore logout errors
  }
}
