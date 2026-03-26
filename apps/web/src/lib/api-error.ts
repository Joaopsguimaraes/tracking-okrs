import axios from 'axios';

import type { ApiErrorResponse } from '@tracking-okrs/shared-types';

export type ParsedApiError = {
  code: string;
  message: string;
  details?: Record<string, string | string[] | undefined>;
  statusCode?: number;
};

export const parseApiError = (error: unknown): ParsedApiError => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return {
      code: error.response?.data.error.code ?? 'request_failed',
      message: error.response?.data.error.message ?? 'Request failed',
      ...(error.response?.data.error.details
        ? {
            details: error.response.data.error.details,
          }
        : {}),
      ...(error.response?.status
        ? {
            statusCode: error.response.status,
          }
        : {}),
    };
  }

  if (error instanceof Error) {
    return {
      code: 'unexpected_error',
      message: error.message,
    };
  }

  return {
    code: 'unexpected_error',
    message: 'Unexpected error',
  };
};

export const getFieldErrorMessage = (value: string | string[] | undefined): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
};
