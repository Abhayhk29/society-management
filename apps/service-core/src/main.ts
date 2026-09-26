import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import type { NestExpressApplication } from '@nestjs/platform-express';
import {
  createAppLogger,
  isProductionEnv,
  resolveCorsOrigins,
  resolveTrustProxy,
} from '@society/nest-config';
import helmet from 'helmet';
import {
  CORE_PACKAGE,
  HEALTH_PACKAGE,
  billingProto,
  communityProto,
  healthProto,
  protoRoot,
  societyProto,
  userProto,
  vendorProto,
  notificationProto,
} from 'shared-protos';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = createAppLogger('service-core');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
  });
  const isProd = isProductionEnv();

  const trustProxy = resolveTrustProxy();
  if (trustProxy !== false) {
    app.set('trust proxy', trustProxy);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'same-site' },
      contentSecurityPolicy: false,
      hsts: isProd
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: false }
        : false,
    }),
  );

  // Core HTTP is mainly for local debug; only enable CORS when explicitly configured.
  const origins = resolveCorsOrigins({
    allowDevDefaults: false,
    requireInProduction: false,
  });
  if (origins.length > 0) {
    app.enableCors({
      origin: origins,
      credentials: true,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const grpcUrl = process.env.GRPC_URL ?? '0.0.0.0:50051';

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [HEALTH_PACKAGE, CORE_PACKAGE],
      protoPath: [
        healthProto,
        userProto,
        societyProto,
        billingProto,
        communityProto,
        vendorProto,
        notificationProto,
      ],
      url: grpcUrl,
      loader: {
        keepCase: false,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [protoRoot],
      },
    },
  });

  await app.startAllMicroservices();
  const port = process.env.PORT ?? 3008;
  await app.listen(port);
  logger.log(`service-core HTTP on ${port}, gRPC on ${grpcUrl}`);
}
bootstrap();
