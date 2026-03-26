import type { ApiSuccessResponse, AuthSessionResponse } from '@tracking-okrs/shared-types';

import { http } from '@/services/http';

export const authService = {
  async getSession(): Promise<AuthSessionResponse> {
    const response = await http.get<ApiSuccessResponse<AuthSessionResponse>>('/auth/me');
    return response.data.data;
  },
};
