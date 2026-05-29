import { api } from '@/lib/api';

export type UpdateProfilePayload = {
  fullName: string;
  phoneNumber?: string;
};

export type UpdateProfileResponse = {
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: string;
};

export const profileService = {
  update: (payload: UpdateProfilePayload): Promise<UpdateProfileResponse> =>
    api.put<UpdateProfileResponse>('/profile', payload),

  changePassword: (payload: { currentPassword: string; newPassword: string }): Promise<void> =>
    api.put<void>('/profile/password', payload),
};
