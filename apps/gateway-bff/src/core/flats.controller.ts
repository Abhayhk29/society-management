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
import { CreateFlatDto, UpdateFlatDto } from './dto/society.dto.js';

@ApiTags('society')
@ApiBearerAuth('access-token')
@Controller('flats')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FlatsController {
  constructor(private readonly coreSociety: CoreSocietyService) {}

  @Post()
  @RequirePermissions('manage:society')
  create(@Body() dto: CreateFlatDto) {
    return this.coreSociety.createFlat(
      dto as unknown as Record<string, unknown>,
    );
  }

  @Get(':uid')
  @RequirePermissions('view:society')
  findOne(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreSociety.getFlat(uid);
  }

  @Patch(':uid')
  @RequirePermissions('manage:society')
  update(@Param('uid', ParseUUIDPipe) uid: string, @Body() dto: UpdateFlatDto) {
    return this.coreSociety.updateFlat(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Delete(':uid')
  @RequirePermissions('manage:society')
  remove(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreSociety.deleteFlat(uid);
  }
}
