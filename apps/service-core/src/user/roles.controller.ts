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
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { AssignPermissionDto } from './dto/assign-permission.dto.js';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { RolesService } from './roles.service.js';

@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('manage:roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Get()
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':uid')
  findOne(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.rolesService.findOne(uid);
  }

  @Patch(':uid')
  update(@Param('uid', ParseUUIDPipe) uid: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(uid, dto);
  }

  @Delete(':uid')
  remove(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.rolesService.remove(uid);
  }

  @Get(':uid/permissions')
  listPermissions(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.rolesService.listPermissions(uid);
  }

  @Post(':uid/permissions')
  assignPermission(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: AssignPermissionDto,
  ) {
    return this.rolesService.assignPermission(uid, dto.permissionId);
  }

  @Delete(':uid/permissions/:permissionId')
  removePermission(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Param('permissionId', ParseUUIDPipe) permissionId: string,
  ) {
    return this.rolesService.removePermission(uid, permissionId);
  }
}
