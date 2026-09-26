import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { UserModule } from '../user/user.module.js';
import { AuthGrpcController } from './auth.grpc.controller.js';
import { HealthGrpcController } from './health.grpc.controller.js';
import { PermissionGrpcController } from './permission.grpc.controller.js';
import { RoleGrpcController } from './role.grpc.controller.js';
import { UserGrpcController } from './user.grpc.controller.js';

@Module({
  imports: [UserModule, AuthModule],
  controllers: [
    HealthGrpcController,
    UserGrpcController,
    RoleGrpcController,
    PermissionGrpcController,
    AuthGrpcController,
  ],
})
export class GrpcModule {}
