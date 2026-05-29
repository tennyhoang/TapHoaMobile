import * as SecureStore from 'expo-secure-store';
import { API_V1 } from '@/constants/api';

const TOKEN_KEY = 'taphoa_token';

async function buildHeaders(extra?: Record<string, string>) {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Lỗi ${res.status}`);
  return data as T;
}

export const api = {
  get: async <T>(path: string): Promise<T> => {
    const res = await fetch(`${API_V1}${path}`, {
      headers: await buildHeaders(),
    });
    return handleResponse<T>(res);
  },

  post: async <T>(path: string, body: object): Promise<T> => {
    const res = await fetch(`${API_V1}${path}`, {
      method: 'POST',
      headers: await buildHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  },

  put: async <T>(path: string, body: object): Promise<T> => {
    const res = await fetch(`${API_V1}${path}`, {
      method: 'PUT',
      headers: await buildHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  },

  patch: async <T>(path: string, body: object): Promise<T> => {
    const res = await fetch(`${API_V1}${path}`, {
      method: 'PATCH',
      headers: await buildHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  },

  delete: async <T>(path: string): Promise<T> => {
    const res = await fetch(`${API_V1}${path}`, {
      method: 'DELETE',
      headers: await buildHeaders(),
    });
    return handleResponse<T>(res);
  },
};
