import { Module } from '@nestjs/common';
import { AuthVerificationService } from '../auth/auth-verification.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { GrpcClientsModule } from '../grpc/grpc-clients.module.js';
import { VendorController } from './vendor.controller.js';
import { VendorGatewayService } from './vendor.service.js';

@Module({
  imports: [GrpcClientsModule],
  controllers: [VendorController],
  providers: [
    VendorGatewayService,
    AuthVerificationService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
})
export class VendorModule {}
