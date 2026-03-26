import type { NextFunction, Request, Response } from 'express';

import type { ApiErrorResponse } from '@tracking-okrs/shared-types';

export const errorHandler = (
  error: unknown,
  _request: Request,
  response: Response<ApiErrorResponse>,
  _next: NextFunction,
): void => {
  void _next;
  const message = error instanceof Error ? error.message : 'Unexpected error';

  response.status(500).json({
    error: {
      code: 'internal_server_error',
      message,
    },
  });
};
