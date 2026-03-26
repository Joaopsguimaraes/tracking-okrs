import { createServer } from 'node:http';

import { createApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './db/pool.js';
import { telemetry } from './telemetry/tracing.js';

const bootstrap = async (): Promise<void> => {
  telemetry.start();
  await pool.query('select 1');

  const app = createApp();
  const server = createServer(app);

  server.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });

  const shutdown = async (): Promise<void> => {
    await telemetry.shutdown();
    await pool.end();
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', () => {
    void shutdown();
  });

  process.on('SIGTERM', () => {
    void shutdown();
  });
};

void bootstrap();
