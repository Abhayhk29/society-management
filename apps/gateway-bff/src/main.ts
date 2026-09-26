import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  createAppLogger,
  isProductionEnv,
  resolveCorsOrigins,
  resolveTrustProxy,
} from '@society/nest-config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { setupSwagger } from './swagger.setup.js';

async function bootstrap() {
  const logger = createAppLogger('gateway-bff');
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
      // API + separate SPA origin: allow cross-origin reads of responses
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
      hsts: isProd
        ? { maxAge: 31_536_000, includeSubDomains: true, preload: false }
        : false,
    }),
  );

  const origins = resolveCorsOrigins({ requireInProduction: true });
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: isProd ? 86400 : undefined,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  setupSwagger(app);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
}
bootstrap();
