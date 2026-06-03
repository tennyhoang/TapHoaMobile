import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService, type UpdateProfilePayload } from '@/services/profile.service';
import { queryKeys } from './queryKeys';
import type { UpdateProfileResponse } from '@/services/profile.service';
import type { UseQueryOptions } from '@tanstack/react-query';

export function useProfile(options?: Partial<UseQueryOptions<UpdateProfileResponse>>) {
  return useQuery({
    queryKey: queryKeys.profile.me,
    queryFn: () => profileService.getMe(),
    staleTime: 60_000,
    ...options,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileService.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      profileService.changePassword(payload),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => profileService.deleteAccount(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.profile.me });
    },
  });
}
