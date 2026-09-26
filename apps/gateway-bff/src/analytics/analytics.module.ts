import { Module } from '@nestjs/common';
import { AuthVerificationService } from '../auth/auth-verification.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { GrpcClientsModule } from '../grpc/grpc-clients.module.js';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsGatewayService } from './analytics.service.js';

@Module({
  imports: [GrpcClientsModule],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsGatewayService,
    AuthVerificationService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
})
export class AnalyticsModule {}
