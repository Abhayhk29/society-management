import { Module } from '@nestjs/common';
import { AuthVerificationService } from '../auth/auth-verification.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { GrpcClientsModule } from '../grpc/grpc-clients.module.js';
import { BillingController } from './billing.controller.js';
import { BillingGatewayService } from './billing.service.js';

@Module({
  imports: [GrpcClientsModule],
  controllers: [BillingController],
  providers: [
    BillingGatewayService,
    AuthVerificationService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
})
export class BillingModule {}
