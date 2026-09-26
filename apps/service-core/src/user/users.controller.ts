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
import { AssignRoleDto } from './dto/assign-role.dto.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UsersService } from './users.service.js';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermissions('create:user')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @RequirePermissions('view:user')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':uid')
  @RequirePermissions('view:user')
  findOne(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.usersService.findOne(uid);
  }

  @Patch(':uid')
  @RequirePermissions('update:user')
  update(@Param('uid', ParseUUIDPipe) uid: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(uid, dto);
  }

  @Delete(':uid')
  @RequirePermissions('delete:user')
  remove(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.usersService.remove(uid);
  }

  @Get(':uid/roles')
  @RequirePermissions('manage:roles')
  listRoles(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.usersService.listRoles(uid);
  }

  @Post(':uid/roles')
  @RequirePermissions('manage:roles')
  assignRole(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.usersService.assignRole(uid, dto.roleId);
  }

  @Delete(':uid/roles/:roleId')
  @RequirePermissions('manage:roles')
  removeRole(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Param('roleId', ParseUUIDPipe) roleId: string,
  ) {
    return this.usersService.removeRole(uid, roleId);
  }
}
