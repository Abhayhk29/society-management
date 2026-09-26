import { Module } from '@nestjs/common';
import { AuthVerificationService } from '../auth/auth-verification.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { GrpcClientsModule } from '../grpc/grpc-clients.module.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsGatewayService } from './notifications.service.js';

@Module({
  imports: [GrpcClientsModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsGatewayService,
    AuthVerificationService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
})
export class NotificationsModule {}
