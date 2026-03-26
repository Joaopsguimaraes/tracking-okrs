export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
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
  email: string;
  displayName: string;
  avatarUrl: string | null;
};

export type AuthSessionResponse = {
  user: AuthUser | null;
};
