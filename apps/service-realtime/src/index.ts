import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config';
import { migrate, pool } from './db/pool';
import { setSocketServer } from './events/bus';
import { startGrpcServer } from './grpc/server';
import { log } from './log';
import { socketAuthMiddleware } from './socket/auth';

async function main() {
  await migrate();
  log('info', 'service-realtime DB migrated');

  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: [config.frontendOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
    },
  });

  setSocketServer(io);

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'service-realtime',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/ready', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({
        status: 'ready',
        service: 'service-realtime',
        database: 'up',
        timestamp: new Date().toISOString(),
      });
    } catch {
      res.status(503).json({
        status: 'not_ready',
        service: 'service-realtime',
        database: 'down',
      });
    }
  });

  io.use(socketAuthMiddleware);
  io.on('connection', (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on('join_society', (societyId: string) => {
      if (typeof societyId === 'string' && societyId.length > 0) {
        socket.join(`society:${societyId}`);
      }
    });

    socket.on('leave_society', (societyId: string) => {
      if (typeof societyId === 'string') {
        socket.leave(`society:${societyId}`);
      }
    });
  });

  startGrpcServer(config.grpcUrl, 'service-realtime');

  httpServer.listen(config.port, () => {
    log('info', `service-realtime HTTP/Socket.IO on port ${config.port}`);
  });
}

main().catch((error) => {
  log('error', 'Failed to start service-realtime', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
