import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Membership } from '../society/entities/membership.entity.js';
import { User } from '../user/entities/user.entity.js';
import { NOTIFICATION_CHANNELS } from './channels/channel.port.js';
import type { NotificationChannels } from './channels/channel.port.js';
import {
  EnqueueNotificationDto,
  UpdatePreferencesDto,
} from './dto/notification.dto.js';
import { NotificationPreference } from './entities/notification-preference.entity.js';
import {
  Notification,
  NotificationChannel,
} from './entities/notification.entity.js';
import {
  NotificationResponse,
  PreferencesResponse,
  toNotificationResponse,
  toPreferencesResponse,
} from './notifications.mapper.js';

const ALL_CHANNELS: NotificationChannel[] = ['IN_APP', 'EMAIL', 'SMS', 'PUSH'];

export type NotifyInput = {
  userIds?: string[];
  societyId?: string;
  excludeUserIds?: string[];
  type: string;
  title: string;
  body: string;
  payload?: Record<string, unknown>;
  channels?: NotificationChannel[];
  sourceService?: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepo: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly prefsRepo: Repository<NotificationPreference>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Membership)
    private readonly membershipsRepo: Repository<Membership>,
    @Inject(NOTIFICATION_CHANNELS)
    private readonly channels: NotificationChannels,
  ) {}

  /**
   * Fire-and-forget safe wrapper for domain modules.
   * Never throws to callers — logs failures instead.
   */
  notifySafe(input: NotifyInput): void {
    void this.notify(input).catch((err) => {
      this.logger.warn(
        `notify failed (${input.type}): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    });
  }

  async notify(input: NotifyInput): Promise<NotificationResponse[]> {
    const userIds = new Set<string>(input.userIds ?? []);
    if (input.societyId) {
      const members = await this.membershipsRepo.find({
        where: { society: { uid: input.societyId }, status: 'ACTIVE' },
        relations: { user: true },
      });
      for (const m of members) {
        userIds.add(m.user?.uid ?? m.userId);
      }
    }
    for (const id of input.excludeUserIds ?? []) userIds.delete(id);
    if (userIds.size === 0) return [];

    return this.enqueue({
      userIds: [...userIds],
      societyId: input.societyId,
      type: input.type,
      title: input.title,
      body: input.body,
      payloadJson: input.payload ? JSON.stringify(input.payload) : undefined,
      channels: input.channels,
      sourceService: input.sourceService ?? 'core',
    });
  }

  async enqueue(dto: EnqueueNotificationDto): Promise<NotificationResponse[]> {
    const created: Notification[] = [];
    const uniqueUsers = [...new Set(dto.userIds)];
    const users = await this.usersRepo.find({
      where: { uid: In(uniqueUsers) },
    });
    const userMap = new Map(users.map((u) => [u.uid, u]));

    for (const userId of uniqueUsers) {
      const user = userMap.get(userId);
      if (!user || !user.isActive) continue;

      const prefs = await this.getOrCreatePreferences(userId);
      if (this.isMuted(prefs, dto.type)) continue;

      const requested = dto.channels?.length
        ? dto.channels
        : ALL_CHANNELS.filter((ch) => this.channelAllowed(prefs, ch));

      for (const channel of requested) {
        if (!this.channelAllowed(prefs, channel)) continue;

        const row = this.notificationsRepo.create({
          userId,
          societyId: dto.societyId ?? null,
          channel,
          type: dto.type,
          title: dto.title.trim(),
          body: dto.body.trim(),
          payloadJson: dto.payloadJson?.trim() || null,
          status: 'PENDING',
          sourceService: dto.sourceService?.trim() || 'core',
        });

        try {
          await this.dispatch(row, user);
          row.status = channel === 'IN_APP' ? 'SENT' : 'SENT';
          row.sentAt = new Date();
        } catch (err) {
          row.status = 'FAILED';
          row.errorMessage =
            err instanceof Error ? err.message : 'Delivery failed';
        }
        created.push(await this.notificationsRepo.save(row));
      }
    }

    return created.map(toNotificationResponse);
  }

  async listForUser(
    userId: string,
    opts?: { unreadOnly?: boolean; limit?: number; societyId?: string },
  ): Promise<NotificationResponse[]> {
    const qb = this.notificationsRepo
      .createQueryBuilder('n')
      .where('n.user_id = :userId', { userId })
      .andWhere('n.channel = :channel', { channel: 'IN_APP' })
      .orderBy('n.created_at', 'DESC')
      .take(opts?.limit ?? 50);

    if (opts?.unreadOnly) {
      qb.andWhere('n.status != :read', { read: 'READ' });
    }
    if (opts?.societyId) {
      qb.andWhere('n.society_id = :societyId', { societyId: opts.societyId });
    }

    const rows = await qb.getMany();
    return rows.map(toNotificationResponse);
  }

  async markRead(
    uid: string,
    actorUserId: string,
  ): Promise<NotificationResponse> {
    const row = await this.notificationsRepo.findOne({ where: { uid } });
    if (!row) throw new NotFoundException(`Notification ${uid} not found`);
    if (row.userId !== actorUserId) {
      throw new ForbiddenException('Cannot mark another user notification');
    }
    if (row.status !== 'READ') {
      row.status = 'READ';
      row.readAt = new Date();
      await this.notificationsRepo.save(row);
    }
    return toNotificationResponse(row);
  }

  async markAllRead(actorUserId: string): Promise<number> {
    const result = await this.notificationsRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ status: 'READ', readAt: () => 'NOW()' })
      .where('user_id = :userId', { userId: actorUserId })
      .andWhere('channel = :channel', { channel: 'IN_APP' })
      .andWhere('status != :read', { read: 'READ' })
      .execute();
    return result.affected ?? 0;
  }

  async unreadCount(userId: string): Promise<number> {
    return this.notificationsRepo.count({
      where: { userId, channel: 'IN_APP', status: In(['PENDING', 'SENT']) },
    });
  }

  async getPreferences(userId: string): Promise<PreferencesResponse> {
    return toPreferencesResponse(await this.getOrCreatePreferences(userId));
  }

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesDto,
  ): Promise<PreferencesResponse> {
    const prefs = await this.getOrCreatePreferences(userId);
    if (dto.emailEnabled !== undefined) prefs.emailEnabled = dto.emailEnabled;
    if (dto.smsEnabled !== undefined) prefs.smsEnabled = dto.smsEnabled;
    if (dto.pushEnabled !== undefined) prefs.pushEnabled = dto.pushEnabled;
    if (dto.inAppEnabled !== undefined) prefs.inAppEnabled = dto.inAppEnabled;
    if (dto.mutedTypes !== undefined) prefs.mutedTypes = dto.mutedTypes.trim();
    await this.prefsRepo.save(prefs);
    return toPreferencesResponse(prefs);
  }

  private async getOrCreatePreferences(
    userId: string,
  ): Promise<NotificationPreference> {
    let prefs = await this.prefsRepo.findOne({ where: { userId } });
    if (!prefs) {
      prefs = await this.prefsRepo.save(
        this.prefsRepo.create({
          userId,
          emailEnabled: true,
          smsEnabled: true,
          pushEnabled: true,
          inAppEnabled: true,
          mutedTypes: '',
        }),
      );
    }
    return prefs;
  }

  private channelAllowed(
    prefs: NotificationPreference,
    channel: NotificationChannel,
  ): boolean {
    switch (channel) {
      case 'EMAIL':
        return prefs.emailEnabled;
      case 'SMS':
        return prefs.smsEnabled;
      case 'PUSH':
        return prefs.pushEnabled;
      case 'IN_APP':
        return prefs.inAppEnabled;
      default:
        return false;
    }
  }

  private isMuted(prefs: NotificationPreference, type: string): boolean {
    if (!prefs.mutedTypes) return false;
    return prefs.mutedTypes
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean)
      .includes(type.toUpperCase());
  }

  private async dispatch(row: Notification, user: User): Promise<void> {
    switch (row.channel) {
      case 'IN_APP':
        return;
      case 'EMAIL':
        await this.channels.sendEmail(user.email, row.title, row.body);
        return;
      case 'SMS':
        if (!user.phoneNumber) {
          throw new Error('User has no phone number');
        }
        await this.channels.sendSms(
          user.phoneNumber,
          `${row.title}: ${row.body}`,
        );
        return;
      case 'PUSH':
        await this.channels.sendPush(user.uid, row.title, row.body);
        return;
      default:
        throw new Error(`Unknown channel ${row.channel}`);
    }
  }
}
