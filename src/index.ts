import './config/config.js';
import type { Server } from 'node:http';
import { sql } from 'drizzle-orm';

import app from './app.js';
import { db, pool } from './db/db.js';

const PORT = Number(process.env.PORT ?? 8000);

let server: Server | undefined;
let isShuttingDown = false;

async function startServer(): Promise<void> {
  try {
    // Verify that PostgreSQL is reachable before accepting requests.
    await db.execute(sql`SELECT 1`);

    console.log('Database connected successfully');

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (error: Error) => {
      console.error('HTTP server error:', error);
    });
  } catch (error: unknown) {
    console.error('Server startup failed:', error);

    try {
      await pool.end();
    } catch (poolError: unknown) {
      console.error('Failed to close database pool:', poolError);
    }

    process.exit(1);
  }
}

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;

  console.log(`${signal} received. Shutting down gracefully...`);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });

      console.log('HTTP server closed');
    }

    await pool.end();
    console.log('Database pool closed');

    process.exit(0);
  } catch (error: unknown) {
    console.error('Graceful shutdown failed:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

void startServer();
