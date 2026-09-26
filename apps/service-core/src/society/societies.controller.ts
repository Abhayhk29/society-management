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
import { CreateSocietyDto, UpdateSocietyDto } from './dto/society.dto.js';
import { SocietiesService } from './societies.service.js';

@Controller('societies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SocietiesController {
  constructor(private readonly societiesService: SocietiesService) {}

  @Post()
  @RequirePermissions('manage:society')
  create(@Body() dto: CreateSocietyDto) {
    return this.societiesService.create(dto);
  }

  @Get()
  @RequirePermissions('view:society')
  findAll() {
    return this.societiesService.findAll();
  }

  @Get(':uid')
  @RequirePermissions('view:society')
  findOne(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.societiesService.findOne(uid);
  }

  @Patch(':uid')
  @RequirePermissions('manage:society')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateSocietyDto,
  ) {
    return this.societiesService.update(uid, dto);
  }

  @Delete(':uid')
  @RequirePermissions('manage:society')
  remove(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.societiesService.remove(uid);
  }
}
