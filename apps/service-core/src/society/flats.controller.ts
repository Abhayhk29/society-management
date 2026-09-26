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
import { CreateFlatDto, UpdateFlatDto } from './dto/flat.dto.js';
import { FlatsService } from './flats.service.js';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FlatsController {
  constructor(private readonly flatsService: FlatsService) {}

  @Post('flats')
  @RequirePermissions('manage:society')
  create(@Body() dto: CreateFlatDto) {
    return this.flatsService.create(dto);
  }

  @Get('buildings/:buildingId/flats')
  @RequirePermissions('view:society')
  findByBuilding(@Param('buildingId', ParseUUIDPipe) buildingId: string) {
    return this.flatsService.findByBuilding(buildingId);
  }

  @Get('flats/:uid')
  @RequirePermissions('view:society')
  findOne(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.flatsService.findOne(uid);
  }

  @Patch('flats/:uid')
  @RequirePermissions('manage:society')
  update(@Param('uid', ParseUUIDPipe) uid: string, @Body() dto: UpdateFlatDto) {
    return this.flatsService.update(uid, dto);
  }

  @Delete('flats/:uid')
  @RequirePermissions('manage:society')
  remove(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.flatsService.remove(uid);
  }
}
