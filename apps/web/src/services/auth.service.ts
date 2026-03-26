import type {
  ApiSuccessResponse,
  AuthSessionResponse,
  LoginInput,
  RegisterInput,
  RegisterResponse,
  ResendVerificationEmailInput,
  ResendVerificationEmailResponse,
} from '@tracking-okrs/shared-types';

import { http } from '@/services/http';

export const authService = {
  async getSession(): Promise<AuthSessionResponse> {
    const response = await http.get<ApiSuccessResponse<AuthSessionResponse>>('/auth/me');
    return response.data.data;
  },

  async login(input: LoginInput): Promise<AuthSessionResponse> {
    const response = await http.post<ApiSuccessResponse<AuthSessionResponse>>('/auth/login', input);
    return response.data.data;
  },

  async register(input: RegisterInput): Promise<RegisterResponse> {
    const response = await http.post<ApiSuccessResponse<RegisterResponse>>('/auth/register', input);
    return response.data.data;
  },

  async logout(): Promise<void> {
    await http.post('/auth/logout');
  },

  async resendVerificationEmail(
    input: ResendVerificationEmailInput,
  ): Promise<ResendVerificationEmailResponse> {
    const response = await http.post<ApiSuccessResponse<ResendVerificationEmailResponse>>(
      '/auth/resend-verification',
      input,
    );

    return response.data.data;
  },

  getGithubLoginUrl(): string {
    return '/api/v1/auth/github';
  },
};
