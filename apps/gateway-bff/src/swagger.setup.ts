import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * OpenAPI UI at /docs and JSON at /docs-json.
 * Disabled when SWAGGER_ENABLED=false (recommended in production).
 */
export function setupSwagger(app: INestApplication): void {
  const isProd = process.env.NODE_ENV === 'production';
  // Default: on in development, off in production unless explicitly enabled.
  const enabled =
    process.env.SWAGGER_ENABLED != null
      ? !['false', '0', 'off'].includes(
          process.env.SWAGGER_ENABLED.toLowerCase(),
        )
      : !isProd;

  if (!enabled) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle('Nivas Gateway API')
    .setDescription(
      'BFF HTTP surface for Nivas society management. ' +
        'Routes proxy to service-core, service-realtime, and service-analytics over gRPC.',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token from POST /auth/login or /auth/register',
      },
      'access-token',
    )
    .addTag('auth', 'Register, login, refresh, OTP, password reset')
    .addTag('users', 'User CRUD and role assignment')
    .addTag('roles', 'Roles and role permissions')
    .addTag('permissions', 'Permission catalog')
    .addTag('society', 'Societies, buildings, flats, memberships')
    .addTag('billing', 'Bills, payments, receipts, PDF')
    .addTag('community', 'Notices, complaints, visitors')
    .addTag('gate-passes', 'Gate pass workflows (realtime)')
    .addTag('vendors', 'Vendor onboarding and work orders')
    .addTag('notifications', 'In-app inbox and preferences')
    .addTag('analytics', 'Society insights')
    .addTag('health', 'gRPC health probes')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (_controllerKey: string, methodKey: string) =>
      methodKey,
  });

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Nivas Gateway API',
  });
}
