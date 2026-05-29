import { authService } from '../../services/auth.service';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockAuthResponse = {
  accessToken: 'eyJhbGciOiJIUzI1NiJ9.mock',
  email: 'test@example.com',
  fullName: 'Nguyễn Văn Test',
  role: 'Customer',
};

function mockSuccess(data: object) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  });
}

function mockFailure(status: number, message: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: async () => ({ message }),
  });
}

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns auth data on valid credentials', async () => {
      mockSuccess(mockAuthResponse);

      const result = await authService.login('test@example.com', 'password123');

      expect(result).toEqual(mockAuthResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );
    });

    it('throws error with server message on 401', async () => {
      mockFailure(401, 'Email hoặc mật khẩu không đúng.');

      await expect(authService.login('test@example.com', 'wrong')).rejects.toThrow(
        'Email hoặc mật khẩu không đúng.'
      );
    });

    it('throws error with server message on disabled account', async () => {
      mockFailure(401, 'Tài khoản đã bị vô hiệu hóa.');

      await expect(authService.login('disabled@example.com', 'pass')).rejects.toThrow(
        'Tài khoản đã bị vô hiệu hóa.'
      );
    });

    it('throws generic error on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network request failed'));

      await expect(authService.login('test@example.com', 'pass')).rejects.toThrow();
    });
  });

  describe('register', () => {
    it('returns auth data on successful registration', async () => {
      mockSuccess(mockAuthResponse);

      const result = await authService.register(
        'Nguyễn Văn Test',
        'test@example.com',
        'password123'
      );

      expect(result).toEqual(mockAuthResponse);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            fullName: 'Nguyễn Văn Test',
            email: 'test@example.com',
            password: 'password123',
            phoneNumber: undefined,
          }),
        })
      );
    });

    it('includes phoneNumber when provided', async () => {
      mockSuccess(mockAuthResponse);

      await authService.register('Test User', 'test@example.com', 'pass', '0912345678');

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.phoneNumber).toBe('0912345678');
    });

    it('throws error on duplicate email', async () => {
      mockFailure(400, 'Email đã được sử dụng.');

      await expect(authService.register('Test', 'existing@example.com', 'pass')).rejects.toThrow(
        'Email đã được sử dụng.'
      );
    });
  });
});
