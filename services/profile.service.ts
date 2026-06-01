import { api } from '@/lib/api';

export type UpdateProfilePayload = {
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
};

export type UpdateProfileResponse = {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  avatarUrl?: string;
  isActive: boolean;
};

export const profileService = {
  getMe: (): Promise<UpdateProfileResponse> => api.get<UpdateProfileResponse>('/users/me'),

  update: (payload: UpdateProfilePayload): Promise<UpdateProfileResponse> =>
    api.put<UpdateProfileResponse>('/users/me', payload),

  changePassword: (payload: { currentPassword: string; newPassword: string }): Promise<void> =>
    api.patch<void>('/users/me/password', payload),

  deleteAccount: (): Promise<void> => api.delete<void>('/users/me'),
};
