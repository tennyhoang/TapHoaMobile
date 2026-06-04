import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authService.login(email, password),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: ({
      fullName,
      email,
      password,
      phoneNumber,
    }: {
      fullName: string;
      email: string;
      password: string;
      phoneNumber?: string;
    }) => authService.register(fullName, email, password, phoneNumber),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });
}

export function useSocialLogin() {
  return useMutation({
    mutationFn: ({ provider, idToken }: { provider: 'Google'; idToken: string }) =>
      authService.socialLogin(provider, idToken),
  });
}
