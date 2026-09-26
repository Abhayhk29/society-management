import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service.js';
import { SocietiesService } from '../society/societies.service.js';
import { toVisitor } from './community.mapper.js';
import { CreateVisitorDto, UpdateVisitorDto } from './dto/community.dto.js';
import { Visitor } from './entities/visitor.entity.js';

@Injectable()
export class VisitorsService {
  constructor(
    @InjectRepository(Visitor)
    private readonly visitorsRepo: Repository<Visitor>,
    private readonly societiesService: SocietiesService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateVisitorDto, actorUserId: string) {
    await this.societiesService.getEntity(dto.societyId);
    const saved = await this.visitorsRepo.save(
      this.visitorsRepo.create({
        societyId: dto.societyId,
        flatId: dto.flatId ?? null,
        hostUserId: dto.hostUserId ?? actorUserId,
        visitorName: dto.visitorName.trim(),
        visitorPhone: dto.visitorPhone?.trim() || null,
        purpose: dto.purpose?.trim() || null,
        expectedAt: new Date(dto.expectedAt),
        status: 'EXPECTED',
        checkedInAt: null,
        checkedOutAt: null,
        gatePassId: dto.gatePassId ?? null,
      }),
    );
    return toVisitor(saved);
  }

  async list(societyId: string, status?: string) {
    await this.societiesService.getEntity(societyId);
    const rows = await this.visitorsRepo.find({
      where: status
        ? { societyId, status: status as Visitor['status'] }
        : { societyId },
      order: { expectedAt: 'DESC' },
    });
    return rows.map(toVisitor);
  }

  async findOne(uid: string) {
    const row = await this.getEntity(uid);
    return toVisitor(row);
  }

  async update(uid: string, dto: UpdateVisitorDto) {
    const row = await this.getEntity(uid);
    if (dto.visitorName !== undefined) row.visitorName = dto.visitorName.trim();
    if (dto.visitorPhone !== undefined) {
      row.visitorPhone = dto.visitorPhone?.trim() || null;
    }
    if (dto.purpose !== undefined) row.purpose = dto.purpose?.trim() || null;
    if (dto.expectedAt !== undefined) row.expectedAt = new Date(dto.expectedAt);
    if (dto.gatePassId !== undefined) row.gatePassId = dto.gatePassId;
    return toVisitor(await this.visitorsRepo.save(row));
  }

  async checkIn(uid: string) {
    const row = await this.getEntity(uid);
    if (row.status !== 'EXPECTED') {
      throw new BadRequestException(`Cannot check in from ${row.status}`);
    }
    row.status = 'CHECKED_IN';
    row.checkedInAt = new Date();
    const saved = await this.visitorsRepo.save(row);
    this.notifications.notifySafe({
      userIds: [saved.hostUserId],
      societyId: saved.societyId,
      type: 'VISITOR_CHECKED_IN',
      title: 'Visitor checked in',
      body: `${saved.visitorName} has arrived`,
      payload: { visitorId: saved.uid },
      sourceService: 'core',
    });
    return toVisitor(saved);
  }

  async checkOut(uid: string) {
    const row = await this.getEntity(uid);
    if (row.status !== 'CHECKED_IN') {
      throw new BadRequestException(`Cannot check out from ${row.status}`);
    }
    row.status = 'CHECKED_OUT';
    row.checkedOutAt = new Date();
    return toVisitor(await this.visitorsRepo.save(row));
  }

  async cancel(uid: string) {
    const row = await this.getEntity(uid);
    if (row.status === 'CHECKED_OUT' || row.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot cancel from ${row.status}`);
    }
    row.status = 'CANCELLED';
    return toVisitor(await this.visitorsRepo.save(row));
  }

  private async getEntity(uid: string) {
    const row = await this.visitorsRepo.findOne({ where: { uid } });
    if (!row) throw new NotFoundException(`Visitor ${uid} not found`);
    return row;
  }
}
