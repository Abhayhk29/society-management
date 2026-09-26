import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import {
  Permission,
  Role,
  RolePermission,
  User,
  UserRole,
} from './entities/index.js';
import { PermissionsController } from './permissions.controller.js';
import { PermissionsService } from './permissions.service.js';
import { RbacSeedService } from './rbac-seed.service.js';
import { RolesController } from './roles.controller.js';
import { RolesService } from './roles.service.js';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      UserRole,
      Permission,
      RolePermission,
    ]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController, RolesController, PermissionsController],
  providers: [UsersService, RolesService, PermissionsService, RbacSeedService],
  exports: [TypeOrmModule, UsersService, RolesService, PermissionsService],
})
export class UserModule {}
