import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { AuthUser } from '../auth/auth-user.type.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { CreateNoticeDto, UpdateNoticeDto } from './dto/community.dto.js';
import { NoticesService } from './notices.service.js';

@Controller('notices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NoticesController {
  constructor(private readonly noticesService: NoticesService) {}

  @Post()
  @RequirePermissions('manage:notice')
  create(@Body() dto: CreateNoticeDto, @CurrentUser() user: AuthUser) {
    return this.noticesService.create(dto, user.uid);
  }

  @Get()
  @RequirePermissions('view:notice')
  list(
    @Query('societyId', ParseUUIDPipe) societyId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.noticesService.list(societyId, activeOnly === 'true');
  }

  @Get(':uid')
  @RequirePermissions('view:notice')
  get(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.noticesService.findOne(uid);
  }

  @Patch(':uid')
  @RequirePermissions('manage:notice')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateNoticeDto,
  ) {
    return this.noticesService.update(uid, dto);
  }

  @Delete(':uid')
  @RequirePermissions('manage:notice')
  remove(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.noticesService.remove(uid);
  }
}
