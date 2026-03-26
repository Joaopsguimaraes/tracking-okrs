export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: Record<string, string | string[] | undefined>;
  };
};

export type ApiSuccessResponse<TData> = {
  data: TData;
};

export type Quarter = {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
};

export type Objective = {
  id: string;
  quarterId: string;
  title: string;
  description: string | null;
};

export type KeyResult = {
  id: string;
  objectiveId: string;
  quarterId: string;
  title: string;
  description: string | null;
  progressPercentage: number;
};

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  job: string | null;
  isVerified: boolean;
};

export type AuthSessionResponse = {
  user: AuthUser | null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  username: string;
  email: string;
  name: string;
  password: string;
  confirmPassword: string;
  avatarUrl?: string;
  job?: string;
};

export type RegisterResponse = {
  email: string;
  resendAvailableAt: string;
  deliveryStatus: 'sent' | 'pending_retry';
};

export type ResendVerificationEmailInput = {
  email: string;
};

export type ResendVerificationEmailResponse = {
  resendAvailableAt: string;
  deliveryStatus: 'sent' | 'pending_retry';
};

export type VerificationStatusResponse = {
  status: 'verified' | 'invalid' | 'expired';
};
