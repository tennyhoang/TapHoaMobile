import { biometrics } from '@/lib/biometrics';

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  authenticateAsync: jest.fn(),
}));

const LA = jest.requireMock('expo-local-authentication');

describe('biometrics', () => {
  beforeEach(() => {
    LA.hasHardwareAsync.mockResolvedValue(true);
    LA.isEnrolledAsync.mockResolvedValue(true);
    LA.authenticateAsync.mockResolvedValue({ success: true });
  });

  it('isAvailable returns true when hardware and enrollment present', async () => {
    expect(await biometrics.isAvailable()).toBe(true);
  });

  it('isAvailable returns false when hardware not present', async () => {
    LA.hasHardwareAsync.mockResolvedValueOnce(false);
    expect(await biometrics.isAvailable()).toBe(false);
  });

  it('isAvailable returns false when not enrolled', async () => {
    LA.isEnrolledAsync.mockResolvedValueOnce(false);
    expect(await biometrics.isAvailable()).toBe(false);
  });

  it('authenticate returns true on success', async () => {
    expect(await biometrics.authenticate('test reason')).toBe(true);
  });

  it('authenticate returns false when authentication fails', async () => {
    LA.authenticateAsync.mockResolvedValueOnce({ success: false });
    expect(await biometrics.authenticate('test')).toBe(false);
  });

  it('authenticate returns true when biometrics not available', async () => {
    LA.hasHardwareAsync.mockResolvedValueOnce(false);
    expect(await biometrics.authenticate('test')).toBe(true);
  });
});
