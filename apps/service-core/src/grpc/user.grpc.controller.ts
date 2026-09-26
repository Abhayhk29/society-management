import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { UsersService } from '../user/users.service.js';
import { toRpcException } from './grpc-exception.util.js';
import { mapUser } from './user-grpc.mapper.js';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UserGrpcController {
  constructor(private readonly usersService: UsersService) {}

  @GrpcMethod('UserService', 'CreateUser')
  @RequirePermissions('create:user')
  async createUser(data: {
    email: string;
    phoneNumber?: string;
    password: string;
    firstName: string;
    lastName: string;
    isActive?: boolean;
    hasIsActive?: boolean;
  }) {
    try {
      const user = await this.usersService.create({
        email: data.email,
        phoneNumber: data.phoneNumber || undefined,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        isActive: data.hasIsActive ? data.isActive : undefined,
      });
      return mapUser(user);
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('UserService', 'ListUsers')
  @RequirePermissions('view:user')
  async listUsers() {
    try {
      const users = await this.usersService.findAll();
      return { users: users.map(mapUser) };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('UserService', 'GetUser')
  @RequirePermissions('view:user')
  async getUser(data: { uid: string }) {
    try {
      return mapUser(await this.usersService.findOne(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('UserService', 'UpdateUser')
  @RequirePermissions('update:user')
  async updateUser(data: {
    uid: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
    hasEmail?: boolean;
    hasPhoneNumber?: boolean;
    hasPassword?: boolean;
    hasFirstName?: boolean;
    hasLastName?: boolean;
    hasIsActive?: boolean;
    clearPhoneNumber?: boolean;
  }) {
    try {
      const user = await this.usersService.update(data.uid, {
        email: data.hasEmail ? data.email : undefined,
        phoneNumber: data.clearPhoneNumber
          ? null
          : data.hasPhoneNumber
            ? data.phoneNumber
            : undefined,
        password: data.hasPassword ? data.password : undefined,
        firstName: data.hasFirstName ? data.firstName : undefined,
        lastName: data.hasLastName ? data.lastName : undefined,
        isActive: data.hasIsActive ? data.isActive : undefined,
      });
      return mapUser(user);
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('UserService', 'DeleteUser')
  @RequirePermissions('delete:user')
  async deleteUser(data: { uid: string }) {
    try {
      return mapUser(await this.usersService.remove(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('UserService', 'ListUserRoles')
  @RequirePermissions('manage:roles')
  async listUserRoles(data: { uid: string }) {
    try {
      const items = await this.usersService.listRoles(data.uid);
      return {
        items: items.map((item) => ({
          uid: item.uid,
          assignedAt: item.assignedAt.toISOString(),
          role: {
            uid: item.role.uid,
            name: item.role.name,
            description: item.role.description ?? '',
          },
        })),
      };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('UserService', 'AssignRole')
  @RequirePermissions('manage:roles')
  async assignRole(data: { userId: string; roleId: string }) {
    try {
      const result = await this.usersService.assignRole(
        data.userId,
        data.roleId,
      );
      return {
        uid: result.uid,
        assignedAt: result.assignedAt.toISOString(),
        userId: result.userId,
        roleId: result.roleId,
      };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('UserService', 'RemoveRole')
  @RequirePermissions('manage:roles')
  async removeRole(data: { userId: string; roleId: string }) {
    try {
      const result = await this.usersService.removeRole(
        data.userId,
        data.roleId,
      );
      return { removed: result.removed, uid: data.userId };
    } catch (error) {
      throw toRpcException(error);
    }
  }
}
