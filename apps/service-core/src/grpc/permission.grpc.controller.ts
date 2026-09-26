import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { PermissionsService } from '../user/permissions.service.js';
import { toRpcException } from './grpc-exception.util.js';
import { mapPermission } from './user-grpc.mapper.js';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('manage:permissions')
export class PermissionGrpcController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @GrpcMethod('PermissionService', 'CreatePermission')
  async createPermission(data: {
    action: string;
    module: string;
    description?: string;
  }) {
    try {
      return mapPermission(
        await this.permissionsService.create({
          action: data.action,
          module: data.module,
          description: data.description || undefined,
        }),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('PermissionService', 'ListPermissions')
  async listPermissions() {
    try {
      const permissions = await this.permissionsService.findAll();
      return { permissions: permissions.map(mapPermission) };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('PermissionService', 'GetPermission')
  async getPermission(data: { uid: string }) {
    try {
      return mapPermission(await this.permissionsService.findOne(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('PermissionService', 'UpdatePermission')
  async updatePermission(data: {
    uid: string;
    action?: string;
    module?: string;
    description?: string;
    hasAction?: boolean;
    hasModule?: boolean;
    hasDescription?: boolean;
    clearDescription?: boolean;
  }) {
    try {
      return mapPermission(
        await this.permissionsService.update(data.uid, {
          action: data.hasAction ? data.action : undefined,
          module: data.hasModule ? data.module : undefined,
          description: data.clearDescription
            ? null
            : data.hasDescription
              ? data.description
              : undefined,
        }),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('PermissionService', 'DeletePermission')
  async deletePermission(data: { uid: string }) {
    try {
      const result = await this.permissionsService.remove(data.uid);
      return { removed: result.removed, uid: result.uid };
    } catch (error) {
      throw toRpcException(error);
    }
  }
}
