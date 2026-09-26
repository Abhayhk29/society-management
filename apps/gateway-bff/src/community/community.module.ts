import { Module } from '@nestjs/common';
import { AuthVerificationService } from '../auth/auth-verification.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { GrpcClientsModule } from '../grpc/grpc-clients.module.js';
import { CommunityController } from './community.controller.js';
import { CommunityGatewayService } from './community.service.js';

@Module({
  imports: [GrpcClientsModule],
  controllers: [CommunityController],
  providers: [
    CommunityGatewayService,
    AuthVerificationService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
})
export class CommunityModule {}
