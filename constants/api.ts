// Physical device: đổi thành IP LAN của máy tính (vd: http://192.168.1.5:5084)
// Android Emulator: http://10.0.2.2:5084
// iOS Simulator: http://localhost:5084
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'https://taphoa-api-dev.onrender.com';

export const API_V1 = `${API_BASE_URL}/api/v1`;
