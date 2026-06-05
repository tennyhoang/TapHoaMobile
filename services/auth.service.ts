import { API_V1 } from '@/constants/api';

type AuthResponse = {
  accessToken: string;
  email: string;
  fullName: string;
  role: string;
};

async function request<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${API_V1}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || `Lỗi ${res.status}`);
  }

  return data;
}

export const authService = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { email, password }),

  register: (fullName: string, email: string, password: string, phoneNumber?: string) =>
    request<AuthResponse>('/auth/register', { fullName, email, password, phoneNumber }),

  forgotPassword: (email: string) =>
    request<{ message: string }>('/auth/forgot-password', { email }),

  socialLogin: (provider: 'Google', idToken: string) =>
    request<AuthResponse>('/auth/social-login', { provider, token: idToken }),
};
