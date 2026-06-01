import { storage } from '@/lib/storage';
import { API_V1 } from '@/constants/api';

const TOKEN_KEY = 'taphoa_token';

// Injected by AuthProvider so api.ts can trigger logout without circular deps
let _onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(fn: () => void) {
  _onUnauthorized = fn;
}

async function buildHeaders(extra?: Record<string, string>) {
  const token = await storage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    // Token expired or invalid — clear session and redirect to login
    await storage.deleteItem(TOKEN_KEY);
    await storage.deleteItem('taphoa_user');
    _onUnauthorized?.();
    throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Lỗi ${res.status}`);
  return data as T;
}

export const api = {
  get: async <T>(path: string): Promise<T> => {
    const res = await fetch(`${API_V1}${path}`, { headers: await buildHeaders() });
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
