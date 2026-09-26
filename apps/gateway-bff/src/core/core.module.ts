import { Module } from '@nestjs/common';
import { AuthVerificationService } from '../auth/auth-verification.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { GrpcClientsModule } from '../grpc/grpc-clients.module.js';
import { AuthController } from './auth.controller.js';
import { BuildingsController } from './buildings.controller.js';
import { CoreRbacService } from './core-rbac.service.js';
import { CoreSocietyService } from './core-society.service.js';
import { FlatsController } from './flats.controller.js';
import { MembershipsController } from './memberships.controller.js';
import { PermissionsController } from './permissions.controller.js';
import { RolesController } from './roles.controller.js';
import { SocietiesController } from './societies.controller.js';
import { UsersController } from './users.controller.js';

@Module({
  imports: [GrpcClientsModule],
  controllers: [
    AuthController,
    UsersController,
    RolesController,
    PermissionsController,
    SocietiesController,
    BuildingsController,
    FlatsController,
    MembershipsController,
  ],
  providers: [
    CoreRbacService,
    CoreSocietyService,
    AuthVerificationService,
    JwtAuthGuard,
    PermissionsGuard,
  ],
})
export class CoreModule {}
