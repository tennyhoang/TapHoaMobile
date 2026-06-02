import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

// expo-local-authentication has no web implementation — guard all calls
const LA = Platform.OS !== 'web' ? LocalAuthentication : null;

export const biometrics = {
  isAvailable: async (): Promise<boolean> => {
    if (!LA) return false;
    const compatible = await LA.hasHardwareAsync();
    if (!compatible) return false;
    return LA.isEnrolledAsync();
  },

  authenticate: async (reason: string): Promise<boolean> => {
    if (!LA) return true; // web: skip biometrics, allow action
    const available = await biometrics.isAvailable();
    if (!available) return true; // no biometrics enrolled: skip

    const result = await LA.authenticateAsync({
      promptMessage: reason,
      fallbackLabel: 'Dùng mã PIN',
      cancelLabel: 'Huỷ',
      disableDeviceFallback: false,
    });
    return result.success;
  },
};
