import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Permission,
  Role,
  RolePermission,
  User,
  UserRole,
} from './entities/index.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      UserRole,
      Permission,
      RolePermission,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class UserModule {}
