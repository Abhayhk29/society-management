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
import { CoreSocietyService } from './core-society.service.js';
import { CreateBuildingDto, UpdateBuildingDto } from './dto/society.dto.js';

@ApiTags('society')
@ApiBearerAuth('access-token')
@Controller('buildings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BuildingsController {
  constructor(private readonly coreSociety: CoreSocietyService) {}

  @Post()
  @RequirePermissions('manage:society')
  create(@Body() dto: CreateBuildingDto) {
    return this.coreSociety.createBuilding(
      dto as unknown as Record<string, unknown>,
    );
  }

  @Get(':uid/flats')
  @RequirePermissions('view:society')
  listFlats(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreSociety.listFlatsByBuilding(uid);
  }

  @Get(':uid')
  @RequirePermissions('view:society')
  findOne(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreSociety.getBuilding(uid);
  }

  @Patch(':uid')
  @RequirePermissions('manage:society')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateBuildingDto,
  ) {
    return this.coreSociety.updateBuilding(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Delete(':uid')
  @RequirePermissions('manage:society')
  remove(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreSociety.deleteBuilding(uid);
  }
}
