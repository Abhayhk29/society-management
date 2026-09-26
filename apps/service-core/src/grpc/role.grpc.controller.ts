import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { RolesService } from '../user/roles.service.js';
import { dateToString, toRpcException } from './grpc-exception.util.js';
import { mapPermission, mapRole } from './user-grpc.mapper.js';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('manage:roles')
export class RoleGrpcController {
  constructor(private readonly rolesService: RolesService) {}

  @GrpcMethod('RoleService', 'CreateRole')
  async createRole(data: { name: string; description?: string }) {
    try {
      return mapRole(
        await this.rolesService.create({
          name: data.name,
          description: data.description || undefined,
        }),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('RoleService', 'ListRoles')
  async listRoles() {
    try {
      const roles = await this.rolesService.findAll();
      return { roles: roles.map(mapRole) };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('RoleService', 'GetRole')
  async getRole(data: { uid: string }) {
    try {
      const role = await this.rolesService.findOne(data.uid);
      return {
        uid: role.uid,
        name: role.name,
        description: role.description ?? '',
        createdAt: dateToString(role.createdAt),
        permissions: (role.permissions ?? []).map(mapPermission),
      };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('RoleService', 'UpdateRole')
  async updateRole(data: {
    uid: string;
    name?: string;
    description?: string;
    hasName?: boolean;
    hasDescription?: boolean;
    clearDescription?: boolean;
  }) {
    try {
      const role = await this.rolesService.update(data.uid, {
        name: data.hasName ? data.name : undefined,
        description: data.clearDescription
          ? null
          : data.hasDescription
            ? data.description
            : undefined,
      });
      return {
        uid: role.uid,
        name: role.name,
        description: role.description ?? '',
        createdAt: dateToString(role.createdAt),
        permissions: (role.permissions ?? []).map(mapPermission),
      };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('RoleService', 'DeleteRole')
  async deleteRole(data: { uid: string }) {
    try {
      const result = await this.rolesService.remove(data.uid);
      return { removed: result.removed, uid: result.uid };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('RoleService', 'ListRolePermissions')
  async listRolePermissions(data: { uid: string }) {
    try {
      const items = await this.rolesService.listPermissions(data.uid);
      return {
        items: items.map((item) => ({
          uid: item.uid,
          assignedAt: item.assignedAt.toISOString(),
          permission: mapPermission(item.permission),
        })),
      };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('RoleService', 'AssignPermission')
  async assignPermission(data: { roleId: string; permissionId: string }) {
    try {
      const result = await this.rolesService.assignPermission(
        data.roleId,
        data.permissionId,
      );
      return {
        uid: result.uid,
        assignedAt: result.assignedAt.toISOString(),
        roleId: result.roleId,
        permissionId: result.permissionId,
      };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('RoleService', 'RemovePermission')
  async removePermission(data: { roleId: string; permissionId: string }) {
    try {
      const result = await this.rolesService.removePermission(
        data.roleId,
        data.permissionId,
      );
      return { removed: result.removed, uid: data.roleId };
    } catch (error) {
      throw toRpcException(error);
    }
  }
}
