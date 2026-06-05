import * as SecureStore from 'expo-secure-store';
import { api } from '../../lib/api';

jest.mock('@/lib/i18n', () => ({
  __esModule: true,
  default: {
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === 'errors.error_with_status') return `Lỗi ${opts?.status}`;
      if (key === 'errors.session_expired') return 'Phiên đăng nhập đã hết hạn';
      return key;
    },
    isInitialized: true,
    language: 'vi',
  },
}));

const mockFetch = jest.fn();
(globalThis as unknown as { fetch: jest.Mock }).fetch = mockFetch;

const mockSecureStore = SecureStore as jest.Mocked<typeof SecureStore>;

function mockSuccess(data: object) {
  const body = JSON.stringify(data);
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => data,
    text: async () => body,
  });
}

function mockFailure(status: number, message: string) {
  const body = JSON.stringify({ message });
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ message }),
    text: async () => body,
  });
}

describe('api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSecureStore.getItemAsync.mockResolvedValue(null);
  });

  describe('header building', () => {
    it('includes Content-Type application/json always', async () => {
      mockSuccess({ ok: true });

      await api.get('/test');

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('adds Authorization header when token exists', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue('my-token');
      mockSuccess({ ok: true });

      await api.get('/test');

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBe('Bearer my-token');
    });

    it('omits Authorization header when no token', async () => {
      mockSecureStore.getItemAsync.mockResolvedValue(null);
      mockSuccess({ ok: true });

      await api.get('/test');

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Authorization']).toBeUndefined();
    });
  });

  describe('get', () => {
    it('sends GET request to correct URL', async () => {
      mockSuccess({ data: 'ok' });

      const result = await api.get('/products');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/products'),
        expect.objectContaining({ headers: expect.any(Object) })
      );
      expect(result).toEqual({ data: 'ok' });
    });

    it('throws with server message on non-ok response', async () => {
      mockFailure(404, 'Không tìm thấy');

      await expect(api.get('/not-found')).rejects.toThrow('Không tìm thấy');
    });

    it('throws generic error when no message in response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
        text: async () => '{}',
      });

      await expect(api.get('/error')).rejects.toThrow('Lỗi 500');
    });
  });

  describe('post', () => {
    it('sends POST with JSON body', async () => {
      mockSuccess({ id: '123' });

      const body = { name: 'test', value: 42 };
      await api.post('/resource', body);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/resource'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body),
        })
      );
    });

    it('returns parsed response data', async () => {
      const responseData = { id: 'new-id', created: true };
      mockSuccess(responseData);

      const result = await api.post('/resource', {});

      expect(result).toEqual(responseData);
    });
  });

  describe('put', () => {
    it('sends PUT with JSON body', async () => {
      mockSuccess({ updated: true });

      const body = { quantity: 5 };
      await api.put('/cart/p1', body);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/cart/p1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(body),
        })
      );
    });
  });

  describe('patch', () => {
    it('sends PATCH with JSON body', async () => {
      mockSuccess({ patched: true });

      await api.patch('/orders/o1/cancel', { cancelReason: 'Đổi ý' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/orders/o1/cancel'),
        expect.objectContaining({ method: 'PATCH' })
      );
    });
  });

  describe('delete', () => {
    it('sends DELETE request', async () => {
      mockSuccess({});

      await api.delete('/cart/p1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/cart/p1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });
});
