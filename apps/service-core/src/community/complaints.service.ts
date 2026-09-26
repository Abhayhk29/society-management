import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service.js';
import { SocietiesService } from '../society/societies.service.js';
import { toComplaint } from './community.mapper.js';
import { CreateComplaintDto, UpdateComplaintDto } from './dto/community.dto.js';
import { Complaint } from './entities/complaint.entity.js';

@Injectable()
export class ComplaintsService {
  constructor(
    @InjectRepository(Complaint)
    private readonly complaintsRepo: Repository<Complaint>,
    private readonly societiesService: SocietiesService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateComplaintDto, actorUserId: string) {
    await this.societiesService.getEntity(dto.societyId);
    const saved = await this.complaintsRepo.save(
      this.complaintsRepo.create({
        societyId: dto.societyId,
        flatId: dto.flatId ?? null,
        raisedByUserId: actorUserId,
        category: dto.category.trim(),
        title: dto.title.trim(),
        description: dto.description.trim(),
        status: 'OPEN',
        assignedToUserId: null,
        resolutionNotes: null,
      }),
    );
    this.notifications.notifySafe({
      societyId: saved.societyId,
      excludeUserIds: [actorUserId],
      type: 'COMPLAINT_RAISED',
      title: 'New complaint',
      body: saved.title,
      payload: { complaintId: saved.uid },
      sourceService: 'core',
    });
    return toComplaint(saved);
  }

  async list(societyId: string, status?: string) {
    await this.societiesService.getEntity(societyId);
    const rows = await this.complaintsRepo.find({
      where: status
        ? { societyId, status: status as Complaint['status'] }
        : { societyId },
      order: { createdAt: 'DESC' },
    });
    return rows.map(toComplaint);
  }

  async findOne(uid: string) {
    const row = await this.complaintsRepo.findOne({ where: { uid } });
    if (!row) throw new NotFoundException(`Complaint ${uid} not found`);
    return toComplaint(row);
  }

  async update(uid: string, dto: UpdateComplaintDto) {
    const row = await this.complaintsRepo.findOne({ where: { uid } });
    if (!row) throw new NotFoundException(`Complaint ${uid} not found`);
    const prevStatus = row.status;
    if (dto.status !== undefined) row.status = dto.status;
    if (dto.assignedToUserId !== undefined) {
      row.assignedToUserId = dto.assignedToUserId;
    }
    if (dto.resolutionNotes !== undefined) {
      row.resolutionNotes = dto.resolutionNotes?.trim() || null;
    }
    const saved = await this.complaintsRepo.save(row);
    if (dto.status !== undefined && dto.status !== prevStatus) {
      this.notifications.notifySafe({
        userIds: [saved.raisedByUserId],
        societyId: saved.societyId,
        type: 'COMPLAINT_UPDATED',
        title: 'Complaint updated',
        body: `${saved.title} is now ${saved.status}`,
        payload: { complaintId: saved.uid, status: saved.status },
        sourceService: 'core',
      });
    }
    return toComplaint(saved);
  }
}
