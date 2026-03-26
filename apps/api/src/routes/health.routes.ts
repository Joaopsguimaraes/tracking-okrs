import { Router, type Response } from 'express';

import type { ApiSuccessResponse } from '@tracking-okrs/shared-types';

export const healthRouter: Router = Router();

healthRouter.get('/', (_request, response: Response<ApiSuccessResponse<{ status: string }>>) => {
  response.status(200).json({
    data: {
      status: 'ok',
    },
  });
});
