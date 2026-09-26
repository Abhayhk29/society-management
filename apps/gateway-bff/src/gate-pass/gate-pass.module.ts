import { Module } from '@nestjs/common';
import { AuthVerificationService } from '../auth/auth-verification.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { GrpcClientsModule } from '../grpc/grpc-clients.module.js';
import { GatePassController } from './gate-pass.controller.js';
import { GatePassService } from './gate-pass.service.js';

@Module({
  imports: [GrpcClientsModule],
  controllers: [GatePassController],
  providers: [
    GatePassService,
    AuthVerificationService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
})
export class GatePassModule {}
