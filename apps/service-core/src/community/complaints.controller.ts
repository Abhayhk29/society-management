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
import { CreateComplaintDto, UpdateComplaintDto } from './dto/community.dto.js';
import { ComplaintsService } from './complaints.service.js';

@Controller('complaints')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  @RequirePermissions('create:complaint')
  create(@Body() dto: CreateComplaintDto, @CurrentUser() user: AuthUser) {
    return this.complaintsService.create(dto, user.uid);
  }

  @Get()
  @RequirePermissions('view:complaint')
  list(
    @Query('societyId', ParseUUIDPipe) societyId: string,
    @Query('status') status?: string,
  ) {
    return this.complaintsService.list(societyId, status);
  }

  @Get(':uid')
  @RequirePermissions('view:complaint')
  get(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.complaintsService.findOne(uid);
  }

  @Patch(':uid')
  @RequirePermissions('manage:complaint')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateComplaintDto,
  ) {
    return this.complaintsService.update(uid, dto);
  }
}
