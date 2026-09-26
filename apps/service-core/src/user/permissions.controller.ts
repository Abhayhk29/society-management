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
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { PermissionsService } from './permissions.service.js';

@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('manage:permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  create(@Body() dto: CreatePermissionDto) {
    return this.permissionsService.create(dto);
  }

  @Get()
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':uid')
  findOne(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.permissionsService.findOne(uid);
  }

  @Patch(':uid')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.permissionsService.update(uid, dto);
  }

  @Delete(':uid')
  remove(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.permissionsService.remove(uid);
  }
}
