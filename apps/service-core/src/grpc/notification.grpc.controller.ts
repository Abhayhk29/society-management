import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { ServiceOrJwtAuthGuard } from '../notifications/guards/service-or-jwt.guard.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { dateToString, toRpcException } from './grpc-exception.util.js';

@Controller()
export class NotificationGrpcController {
  constructor(private readonly notifications: NotificationsService) {}

  @GrpcMethod('NotificationService', 'EnqueueNotification')
  @UseGuards(ServiceOrJwtAuthGuard, PermissionsGuard)
  @RequirePermissions('enqueue:notification')
  async enqueueNotification(data: any) {
    try {
      const notifications = await this.notifications.enqueue({
        userIds: data.userIds ?? [],
        societyId: data.hasSocietyId ? data.societyId : undefined,
        type: data.type,
        title: data.title,
        body: data.body,
        payloadJson: data.payloadJson || undefined,
        channels: data.channels?.length ? data.channels : undefined,
        sourceService: data.sourceService || 'core',
      });
      return {
        notifications: notifications.map((n) => this.map(n)),
        createdCount: notifications.length,
      };
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('NotificationService', 'ListNotifications')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view:notification')
  async listNotifications(data: any) {
    try {
      const notifications = await this.notifications.listForUser(
        data.actorUserId,
        {
          unreadOnly: Boolean(data.unreadOnly),
          limit: data.limit || 50,
          societyId: data.hasSocietyId ? data.societyId : undefined,
        },
      );
      return { notifications: notifications.map((n) => this.map(n)) };
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('NotificationService', 'MarkNotificationRead')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view:notification')
  async markNotificationRead(data: any) {
    try {
      return this.map(
        await this.notifications.markRead(data.uid, data.actorUserId),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('NotificationService', 'MarkAllNotificationsRead')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view:notification')
  async markAllNotificationsRead(data: any) {
    try {
      return {
        updatedCount: await this.notifications.markAllRead(data.actorUserId),
      };
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('NotificationService', 'GetUnreadCount')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view:notification')
  async getUnreadCount(data: any) {
    try {
      return {
        count: await this.notifications.unreadCount(data.actorUserId),
      };
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('NotificationService', 'GetPreferences')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view:notification')
  async getPreferences(data: { uid: string }) {
    try {
      return this.mapPrefs(await this.notifications.getPreferences(data.uid));
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('NotificationService', 'UpdatePreferences')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('view:notification')
  async updatePreferences(data: any) {
    try {
      return this.mapPrefs(
        await this.notifications.updatePreferences(data.userId, {
          emailEnabled: data.hasEmailEnabled ? data.emailEnabled : undefined,
          smsEnabled: data.hasSmsEnabled ? data.smsEnabled : undefined,
          pushEnabled: data.hasPushEnabled ? data.pushEnabled : undefined,
          inAppEnabled: data.hasInAppEnabled ? data.inAppEnabled : undefined,
          mutedTypes: data.hasMutedTypes ? data.mutedTypes : undefined,
        }),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  private map(n: Awaited<ReturnType<NotificationsService['listForUser']>>[0]) {
    return {
      uid: n.uid,
      userId: n.userId,
      societyId: n.societyId ?? '',
      channel: n.channel,
      type: n.type,
      title: n.title,
      body: n.body,
      payloadJson: n.payloadJson ?? '',
      status: n.status,
      sourceService: n.sourceService,
      readAt: dateToString(n.readAt),
      sentAt: dateToString(n.sentAt),
      createdAt: dateToString(n.createdAt),
      updatedAt: dateToString(n.updatedAt),
    };
  }

  private mapPrefs(
    p: Awaited<ReturnType<NotificationsService['getPreferences']>>,
  ) {
    return {
      uid: p.uid,
      userId: p.userId,
      emailEnabled: p.emailEnabled,
      smsEnabled: p.smsEnabled,
      pushEnabled: p.pushEnabled,
      inAppEnabled: p.inAppEnabled,
      mutedTypes: p.mutedTypes,
      createdAt: dateToString(p.createdAt),
      updatedAt: dateToString(p.updatedAt),
    };
  }
}
