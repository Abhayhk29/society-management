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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import {
  EnqueueNotificationDto,
  UpdatePreferencesDto,
} from './dto/notification.dto.js';
import { NotificationsGatewayService } from './notifications.service.js';

@ApiTags('notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsGatewayService) {}

  @Post('enqueue')
  @RequirePermissions('enqueue:notification')
  enqueue(@Body() dto: EnqueueNotificationDto) {
    return this.notifications.enqueue(
      dto as unknown as Record<string, unknown>,
    );
  }

  @Get('unread-count')
  @RequirePermissions('view:notification')
  unreadCount() {
    return this.notifications.unreadCount();
  }

  @Get('preferences/me')
  @RequirePermissions('view:notification')
  getPreferences() {
    return this.notifications.getPreferences();
  }

  @Patch('preferences/me')
  @RequirePermissions('view:notification')
  updatePreferences(@Body() dto: UpdatePreferencesDto) {
    return this.notifications.updatePreferences(
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('read-all')
  @RequirePermissions('view:notification')
  markAllRead() {
    return this.notifications.markAllRead();
  }

  @Get()
  @RequirePermissions('view:notification')
  list(
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('societyId') societyId?: string,
  ) {
    return this.notifications.list(
      unreadOnly === 'true',
      limit ? Number(limit) : undefined,
      societyId,
    );
  }

  @Post(':uid/read')
  @RequirePermissions('view:notification')
  markRead(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.notifications.markRead(uid);
  }
}
