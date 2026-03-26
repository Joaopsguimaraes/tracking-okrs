import type { Request, Response } from 'express';

import type { ApiErrorResponse } from '@tracking-okrs/shared-types';

export const notFoundHandler = (_request: Request, response: Response<ApiErrorResponse>): void => {
  response.status(404).json({
    error: {
      code: 'not_found',
      message: 'Route not found',
    },
  });
};
