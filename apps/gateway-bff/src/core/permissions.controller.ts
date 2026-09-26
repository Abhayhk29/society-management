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
  CreatePermissionDto,
  UpdatePermissionDto,
} from './dto/permission.dto.js';

@ApiTags('permissions')
@ApiBearerAuth('access-token')
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('manage:permissions')
export class PermissionsController {
  constructor(private readonly coreRbac: CoreRbacService) {}

  @Post()
  create(@Body() dto: CreatePermissionDto) {
    return this.coreRbac.createPermission(
      dto as unknown as Record<string, unknown>,
    );
  }

  @Get()
  findAll() {
    return this.coreRbac.listPermissions();
  }

  @Get(':uid')
  findOne(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreRbac.getPermission(uid);
  }

  @Patch(':uid')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return this.coreRbac.updatePermission(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Delete(':uid')
  remove(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreRbac.deletePermission(uid);
  }
}
