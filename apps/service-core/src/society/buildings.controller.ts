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
import { CreateBuildingDto, UpdateBuildingDto } from './dto/building.dto.js';
import { BuildingsService } from './buildings.service.js';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Post('buildings')
  @RequirePermissions('manage:society')
  create(@Body() dto: CreateBuildingDto) {
    return this.buildingsService.create(dto);
  }

  @Get('societies/:societyId/buildings')
  @RequirePermissions('view:society')
  findBySociety(@Param('societyId', ParseUUIDPipe) societyId: string) {
    return this.buildingsService.findBySociety(societyId);
  }

  @Get('buildings/:uid')
  @RequirePermissions('view:society')
  findOne(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.buildingsService.findOne(uid);
  }

  @Patch('buildings/:uid')
  @RequirePermissions('manage:society')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateBuildingDto,
  ) {
    return this.buildingsService.update(uid, dto);
  }

  @Delete('buildings/:uid')
  @RequirePermissions('manage:society')
  remove(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.buildingsService.remove(uid);
  }
}
