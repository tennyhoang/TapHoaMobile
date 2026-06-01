import * as LocalAuthentication from 'expo-local-authentication';

export const biometrics = {
  isAvailable: async (): Promise<boolean> => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  },

  authenticate: async (reason: string): Promise<boolean> => {
    const available = await biometrics.isAvailable();
    if (!available) return true; // skip if device has no biometrics

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Dùng mã PIN',
      cancelLabel: 'Huỷ',
      disableDeviceFallback: false,
    });
    return result.success;
  },
};
