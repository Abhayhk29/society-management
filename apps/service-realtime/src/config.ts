export const config = {
  port: Number(process.env.PORT ?? 3003),
  grpcUrl: process.env.GRPC_URL ?? '0.0.0.0:50052',
  coreGrpcUrl: process.env.CORE_GRPC_URL ?? 'localhost:50051',
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-society-jwt-secret-change-me',
  /** Must match service-core INTERNAL_SERVICE_KEY for EnqueueNotification */
  internalServiceKey:
    process.env.INTERNAL_SERVICE_KEY ?? 'dev-internal-service-key',
  qrSecret:
    process.env.GATE_PASS_QR_SECRET ?? 'dev-gate-pass-qr-secret-change-me',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'society_realtime',
  },
};
