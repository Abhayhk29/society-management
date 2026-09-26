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
import {
  EnqueueNotificationDto,
  UpdatePreferencesDto,
} from './dto/notification.dto.js';
import { ServiceOrJwtAuthGuard } from './guards/service-or-jwt.guard.js';
import { NotificationsService } from './notifications.service.js';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Post('enqueue')
  @UseGuards(ServiceOrJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('enqueue:notification')
  enqueue(@Body() dto: EnqueueNotificationDto) {
    return this.notifications.enqueue(dto);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view:notification')
  async unreadCount(@CurrentUser() user: AuthUser) {
    return { count: await this.notifications.unreadCount(user.uid) };
  }

  @Get('preferences/me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view:notification')
  getPreferences(@CurrentUser() user: AuthUser) {
    return this.notifications.getPreferences(user.uid);
  }

  @Patch('preferences/me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view:notification')
  updatePreferences(
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.notifications.updatePreferences(user.uid, dto);
  }

  @Post('read-all')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view:notification')
  async markAllRead(@CurrentUser() user: AuthUser) {
    return { updatedCount: await this.notifications.markAllRead(user.uid) };
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view:notification')
  list(
    @CurrentUser() user: AuthUser,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('societyId') societyId?: string,
  ) {
    return this.notifications.listForUser(user.uid, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? Number(limit) : undefined,
      societyId,
    });
  }

  @Post(':uid/read')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view:notification')
  markRead(
    @Param('uid', ParseUUIDPipe) uid: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.notifications.markRead(uid, user.uid);
  }
}
