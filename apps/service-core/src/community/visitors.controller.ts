import {
  Body,
  Controller,
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
import { CreateVisitorDto, UpdateVisitorDto } from './dto/community.dto.js';
import { VisitorsService } from './visitors.service.js';

@Controller('visitors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Post()
  @RequirePermissions('manage:visitor')
  create(@Body() dto: CreateVisitorDto, @CurrentUser() user: AuthUser) {
    return this.visitorsService.create(dto, user.uid);
  }

  @Get()
  @RequirePermissions('view:visitor')
  list(
    @Query('societyId', ParseUUIDPipe) societyId: string,
    @Query('status') status?: string,
  ) {
    return this.visitorsService.list(societyId, status);
  }

  @Get(':uid')
  @RequirePermissions('view:visitor')
  get(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.visitorsService.findOne(uid);
  }

  @Patch(':uid')
  @RequirePermissions('manage:visitor')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateVisitorDto,
  ) {
    return this.visitorsService.update(uid, dto);
  }

  @Post(':uid/check-in')
  @RequirePermissions('manage:visitor')
  checkIn(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.visitorsService.checkIn(uid);
  }

  @Post(':uid/check-out')
  @RequirePermissions('manage:visitor')
  checkOut(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.visitorsService.checkOut(uid);
  }

  @Post(':uid/cancel')
  @RequirePermissions('manage:visitor')
  cancel(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.visitorsService.cancel(uid);
  }
}
