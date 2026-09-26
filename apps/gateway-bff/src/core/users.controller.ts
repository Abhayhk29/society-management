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
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { CoreRbacService } from './core-rbac.service.js';
import { AssignRoleDto, CreateUserDto, UpdateUserDto } from './dto/user.dto.js';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly coreRbac: CoreRbacService) {}

  @Post()
  @RequirePermissions('create:user')
  create(@Body() dto: CreateUserDto) {
    return this.coreRbac.createUser(dto as unknown as Record<string, unknown>);
  }

  @Get()
  @RequirePermissions('view:user')
  findAll() {
    return this.coreRbac.listUsers();
  }

  @Get(':uid')
  @RequirePermissions('view:user')
  findOne(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreRbac.getUser(uid);
  }

  @Patch(':uid')
  @RequirePermissions('update:user')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.coreRbac.updateUser(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Delete(':uid')
  @RequirePermissions('delete:user')
  remove(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreRbac.deleteUser(uid);
  }

  @Get(':uid/roles')
  @RequirePermissions('manage:roles')
  listRoles(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreRbac.listUserRoles(uid);
  }

  @Post(':uid/roles')
  @RequirePermissions('manage:roles')
  assignRole(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.coreRbac.assignRole(uid, dto.roleId);
  }

  @Delete(':uid/roles/:roleId')
  @RequirePermissions('manage:roles')
  removeRole(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.coreRbac.removeRole(uid, roleId);
  }
}
