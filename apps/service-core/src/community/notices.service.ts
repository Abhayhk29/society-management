import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service.js';
import { SocietiesService } from '../society/societies.service.js';
import { toNotice } from './community.mapper.js';
import { CreateNoticeDto, UpdateNoticeDto } from './dto/community.dto.js';
import { Notice } from './entities/notice.entity.js';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice) private readonly noticesRepo: Repository<Notice>,
    private readonly societiesService: SocietiesService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateNoticeDto, actorUserId: string) {
    await this.societiesService.getEntity(dto.societyId);
    const saved = await this.noticesRepo.save(
      this.noticesRepo.create({
        societyId: dto.societyId,
        title: dto.title.trim(),
        body: dto.body.trim(),
        priority: dto.priority ?? 'NORMAL',
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : new Date(),
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdByUserId: actorUserId,
        isActive: true,
      }),
    );
    this.notifications.notifySafe({
      societyId: saved.societyId,
      excludeUserIds: [actorUserId],
      type: 'NOTICE_PUBLISHED',
      title: saved.priority === 'HIGH' ? 'Important notice' : 'New notice',
      body: saved.title,
      payload: { noticeId: saved.uid },
      sourceService: 'core',
    });
    return toNotice(saved);
  }

  async list(societyId: string, activeOnly = false) {
    await this.societiesService.getEntity(societyId);
    const rows = await this.noticesRepo.find({
      where: activeOnly ? { societyId, isActive: true } : { societyId },
      order: { publishedAt: 'DESC' },
    });
    return rows.map(toNotice);
  }

  async findOne(uid: string) {
    const notice = await this.noticesRepo.findOne({ where: { uid } });
    if (!notice) throw new NotFoundException(`Notice ${uid} not found`);
    return toNotice(notice);
  }

  async update(uid: string, dto: UpdateNoticeDto) {
    const notice = await this.noticesRepo.findOne({ where: { uid } });
    if (!notice) throw new NotFoundException(`Notice ${uid} not found`);
    if (dto.title !== undefined) notice.title = dto.title.trim();
    if (dto.body !== undefined) notice.body = dto.body.trim();
    if (dto.priority !== undefined) notice.priority = dto.priority;
    if (dto.expiresAt !== undefined) {
      notice.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
    }
    if (dto.isActive !== undefined) notice.isActive = dto.isActive;
    return toNotice(await this.noticesRepo.save(notice));
  }

  async remove(uid: string) {
    return this.update(uid, { isActive: false });
  }
}
