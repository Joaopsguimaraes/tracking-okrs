import cookieParser from 'cookie-parser';
import connectPgSimple from 'connect-pg-simple';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { openApiDocument } from './docs/openapi.js';
import { errorHandler } from './middlewares/error-handler.js';
import { notFoundHandler } from './middlewares/not-found.js';
import { passport } from './modules/auth/passport.js';
import { apiRouter } from './routes/index.js';

export const createApp = (): express.Express => {
  const app = express();
  const PgStore = connectPgSimple(session);

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.APP_ORIGIN,
      credentials: true,
    }),
  );
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 200,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(
    session({
      name: 'tracking_okrs.sid',
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store: new PgStore({
        pool,
        tableName: 'user_sessions',
        createTableIfMissing: true,
      }),
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.NODE_ENV === 'production',
      },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));
  app.get('/api/v1/docs.json', (_request, response) => {
    response.status(200).json(openApiDocument);
  });
  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
