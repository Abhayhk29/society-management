import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { CoreRbacService } from './core-rbac.service.js';
import {
  AssignPermissionDto,
  CreateRoleDto,
  UpdateRoleDto,
} from './dto/role.dto.js';

@ApiTags('roles')
@ApiBearerAuth('access-token')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('manage:roles')
export class RolesController {
  constructor(private readonly coreRbac: CoreRbacService) {}

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.coreRbac.createRole(dto as unknown as Record<string, unknown>);
  }

  @Get()
  findAll() {
    return this.coreRbac.listRoles();
  }

  @Get(':uid')
  findOne(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreRbac.getRole(uid);
  }

  @Patch(':uid')
  update(@Param('uid', ParseUUIDPipe) uid: string, @Body() dto: UpdateRoleDto) {
    return this.coreRbac.updateRole(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Delete(':uid')
  remove(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreRbac.deleteRole(uid);
  }

  @Get(':uid/permissions')
  listPermissions(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreRbac.listRolePermissions(uid);
  }

  @Post(':uid/permissions')
  assignPermission(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: AssignPermissionDto,
  ) {
    return this.coreRbac.assignPermission(uid, dto.permissionId);
  }

  @Delete(':uid/permissions/:permissionId')
  removePermission(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ) {
    return this.coreRbac.removePermission(uid, permissionId);
  }
}
