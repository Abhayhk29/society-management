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
import { CreateSocietyDto, UpdateSocietyDto } from './dto/society.dto.js';

@ApiTags('society')
@ApiBearerAuth('access-token')
@Controller('societies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SocietiesController {
  constructor(private readonly coreSociety: CoreSocietyService) {}

  @Post()
  @RequirePermissions('manage:society')
  create(@Body() dto: CreateSocietyDto) {
    return this.coreSociety.createSociety(
      dto as unknown as Record<string, unknown>,
    );
  }

  @Get()
  @RequirePermissions('view:society')
  findAll() {
    return this.coreSociety.listSocieties();
  }

  @Get(':uid/buildings')
  @RequirePermissions('view:society')
  listBuildings(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreSociety.listBuildingsBySociety(uid);
  }

  @Get(':uid/memberships')
  @RequirePermissions('view:membership')
  listMemberships(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreSociety.listMembershipsBySociety(uid);
  }

  @Get(':uid')
  @RequirePermissions('view:society')
  findOne(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreSociety.getSociety(uid);
  }

  @Patch(':uid')
  @RequirePermissions('manage:society')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateSocietyDto,
  ) {
    return this.coreSociety.updateSociety(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Delete(':uid')
  @RequirePermissions('manage:society')
  remove(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreSociety.deleteSociety(uid);
  }
}
