import { Metadata } from '@grpc/grpc-js';
import { Inject, Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Request } from 'express';
import { firstValueFrom, Observable } from 'rxjs';
import { NOTIFICATION_SERVICE } from 'shared-protos';
import type { GatewayAuthUser } from '../auth/auth-user.type.js';
import { CORE_GRPC } from '../grpc/grpc-clients.module.js';
import { mapGrpcError } from '../grpc/grpc-error.util.js';

type GrpcUnary<TReq, TRes> = (
  data: TReq,
  metadata?: Metadata,
) => Observable<TRes>;

@Injectable({ scope: Scope.REQUEST })
export class NotificationsGatewayService implements OnModuleInit {
  private notifications!: Record<string, GrpcUnary<unknown, unknown>>;

  constructor(
    @Inject(CORE_GRPC) private readonly core: ClientGrpc,
    @Inject(REQUEST)
    private readonly request: Request & { user?: GatewayAuthUser },
  ) {}

  onModuleInit() {
    this.notifications = this.core.getService(NOTIFICATION_SERVICE);
  }

  private meta() {
    const metadata = new Metadata();
    const header = this.request.headers?.authorization;
    if (header) metadata.set('authorization', String(header));
    const serviceKey = this.request.headers?.['x-service-key'];
    if (serviceKey) metadata.set('x-service-key', String(serviceKey));
    return metadata;
  }

  private actor() {
    return { actorUserId: this.request.user?.uid ?? '' };
  }

  private async call<T>(fn: (m: Metadata) => Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(fn(this.meta()));
    } catch (error) {
      mapGrpcError(error);
    }
  }

  enqueue(body: Record<string, unknown>) {
    return this.call((m) =>
      this.notifications.enqueueNotification(
        {
          ...this.actor(),
          userIds: body.userIds,
          societyId: body.societyId ?? '',
          hasSocietyId: body.societyId != null,
          type: body.type,
          title: body.title,
          body: body.body,
          payloadJson: body.payloadJson ?? '',
          channels: body.channels ?? [],
          sourceService: 'gateway',
        },
        m,
      ),
    );
  }

  async list(unreadOnly?: boolean, limit?: number, societyId?: string) {
    const res = (await this.call((m) =>
      this.notifications.listNotifications(
        {
          ...this.actor(),
          unreadOnly: Boolean(unreadOnly),
          limit: limit ?? 50,
          societyId: societyId ?? '',
          hasSocietyId: Boolean(societyId),
        },
        m,
      ),
    )) as { notifications?: unknown[] };
    return res.notifications ?? [];
  }

  markRead(uid: string) {
    return this.call((m) =>
      this.notifications.markNotificationRead({ uid, ...this.actor() }, m),
    );
  }

  markAllRead() {
    return this.call((m) =>
      this.notifications.markAllNotificationsRead({ ...this.actor() }, m),
    );
  }

  unreadCount() {
    return this.call((m) =>
      this.notifications.getUnreadCount({ ...this.actor() }, m),
    );
  }

  getPreferences() {
    return this.call((m) =>
      this.notifications.getPreferences(
        { uid: this.request.user?.uid ?? '' },
        m,
      ),
    );
  }

  updatePreferences(body: Record<string, unknown>) {
    return this.call((m) =>
      this.notifications.updatePreferences(
        {
          userId: this.request.user?.uid ?? '',
          emailEnabled: body.emailEnabled ?? true,
          hasEmailEnabled: body.emailEnabled !== undefined,
          smsEnabled: body.smsEnabled ?? true,
          hasSmsEnabled: body.smsEnabled !== undefined,
          pushEnabled: body.pushEnabled ?? true,
          hasPushEnabled: body.pushEnabled !== undefined,
          inAppEnabled: body.inAppEnabled ?? true,
          hasInAppEnabled: body.inAppEnabled !== undefined,
          mutedTypes: body.mutedTypes ?? '',
          hasMutedTypes: body.mutedTypes !== undefined,
        },
        m,
      ),
    );
  }
}
