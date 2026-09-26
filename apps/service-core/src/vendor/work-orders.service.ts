import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service.js';
import { SocietiesService } from '../society/societies.service.js';
import {
  AssignWorkOrderDto,
  CompleteWorkOrderDto,
  CreateWorkOrderDto,
  DecideQuoteDto,
  HoldOrCancelWorkOrderDto,
  ProposeQuoteDto,
  UpdateWorkOrderDto,
} from './dto/vendor.dto.js';
import { WorkOrderEvent } from './entities/work-order-event.entity.js';
import { WorkOrderQuote } from './entities/work-order-quote.entity.js';
import { WorkOrder, WorkOrderStatus } from './entities/work-order.entity.js';
import {
  EventResponse,
  QuoteResponse,
  toEventResponse,
  toQuoteResponse,
  toWorkOrderResponse,
  WorkOrderResponse,
} from './vendor.mapper.js';
import { VendorsService } from './vendors.service.js';

const EDITABLE: WorkOrderStatus[] = ['DRAFT', 'OPEN', 'QUOTED'];

@Injectable()
export class WorkOrdersService {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly ordersRepo: Repository<WorkOrder>,
    @InjectRepository(WorkOrderQuote)
    private readonly quotesRepo: Repository<WorkOrderQuote>,
    @InjectRepository(WorkOrderEvent)
    private readonly eventsRepo: Repository<WorkOrderEvent>,
    private readonly societiesService: SocietiesService,
    private readonly vendorsService: VendorsService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(
    dto: CreateWorkOrderDto,
    actorUserId: string,
  ): Promise<WorkOrderResponse> {
    await this.societiesService.getEntity(dto.societyId);
    const openNow = dto.openNow !== false;
    const order = await this.ordersRepo.save(
      this.ordersRepo.create({
        societyId: dto.societyId,
        flatId: dto.flatId ?? null,
        buildingId: dto.buildingId ?? null,
        title: dto.title.trim(),
        description: dto.description.trim(),
        category: dto.category ?? 'GENERAL',
        priority: dto.priority ?? 'NORMAL',
        status: openNow ? 'OPEN' : 'DRAFT',
        requestedByUserId: actorUserId,
        complaintId: dto.complaintId ?? null,
        scheduledStartAt: dto.scheduledStartAt
          ? new Date(dto.scheduledStartAt)
          : null,
        scheduledEndAt: dto.scheduledEndAt
          ? new Date(dto.scheduledEndAt)
          : null,
        costEstimate:
          dto.costEstimate != null ? String(dto.costEstimate) : null,
      }),
    );
    await this.addEvent(
      order.uid,
      actorUserId,
      'CREATED',
      null,
      order.status,
      'Work order created',
    );
    return toWorkOrderResponse(order);
  }

  async list(filters: {
    societyId: string;
    status?: string;
    vendorId?: string;
    category?: string;
  }): Promise<WorkOrderResponse[]> {
    await this.societiesService.getEntity(filters.societyId);
    const where: Record<string, unknown> = { societyId: filters.societyId };
    if (filters.status) where.status = filters.status;
    if (filters.vendorId) where.assignedVendorId = filters.vendorId;
    if (filters.category) where.category = filters.category;
    const rows = await this.ordersRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
    return rows.map(toWorkOrderResponse);
  }

  async findOne(uid: string): Promise<WorkOrderResponse> {
    return toWorkOrderResponse(await this.getEntity(uid));
  }

  async update(
    uid: string,
    dto: UpdateWorkOrderDto,
    actorUserId: string,
  ): Promise<WorkOrderResponse> {
    const order = await this.getEntity(uid);
    if (!EDITABLE.includes(order.status)) {
      throw new BadRequestException(
        `Cannot update work order in status ${order.status}`,
      );
    }
    if (dto.title !== undefined) order.title = dto.title.trim();
    if (dto.description !== undefined)
      order.description = dto.description.trim();
    if (dto.category !== undefined) order.category = dto.category;
    if (dto.priority !== undefined) order.priority = dto.priority;
    if (dto.scheduledStartAt !== undefined) {
      order.scheduledStartAt =
        dto.scheduledStartAt == null ? null : new Date(dto.scheduledStartAt);
    }
    if (dto.scheduledEndAt !== undefined) {
      order.scheduledEndAt =
        dto.scheduledEndAt == null ? null : new Date(dto.scheduledEndAt);
    }
    if (dto.costEstimate !== undefined) {
      order.costEstimate =
        dto.costEstimate == null ? null : String(dto.costEstimate);
    }
    await this.ordersRepo.save(order);
    await this.addEvent(
      uid,
      actorUserId,
      'UPDATED',
      order.status,
      order.status,
      'Work order details updated',
    );
    return this.findOne(uid);
  }

  async assign(
    uid: string,
    dto: AssignWorkOrderDto,
    actorUserId: string,
  ): Promise<WorkOrderResponse> {
    const order = await this.getEntity(uid);
    if (!['OPEN', 'QUOTED', 'ASSIGNED', 'ON_HOLD'].includes(order.status)) {
      throw new BadRequestException(
        `Cannot assign work order in status ${order.status}`,
      );
    }
    await this.vendorsService.assertActiveForSociety(
      dto.vendorId,
      order.societyId,
    );
    const from = order.status;
    order.assignedVendorId = dto.vendorId;
    order.status = 'ASSIGNED';
    if (dto.scheduledStartAt) {
      order.scheduledStartAt = new Date(dto.scheduledStartAt);
    }
    await this.ordersRepo.save(order);
    await this.addEvent(
      uid,
      actorUserId,
      'ASSIGNED',
      from,
      'ASSIGNED',
      dto.notes?.trim() || `Assigned vendor ${dto.vendorId}`,
    );
    const vendor = await this.vendorsService.getEntity(dto.vendorId);
    const targets = [order.requestedByUserId];
    if (vendor.userId) targets.push(vendor.userId);
    this.notifications.notifySafe({
      userIds: targets,
      societyId: order.societyId,
      type: 'WORK_ORDER_ASSIGNED',
      title: 'Work order assigned',
      body: `${order.title} → ${vendor.displayName}`,
      payload: { workOrderId: order.uid, vendorId: vendor.uid },
      sourceService: 'core',
    });
    return this.findOne(uid);
  }

  async start(uid: string, actorUserId: string): Promise<WorkOrderResponse> {
    const order = await this.getEntity(uid);
    if (order.status !== 'ASSIGNED' && order.status !== 'ON_HOLD') {
      throw new BadRequestException(
        'Only ASSIGNED or ON_HOLD work orders can be started',
      );
    }
    const from = order.status;
    order.status = 'IN_PROGRESS';
    await this.ordersRepo.save(order);
    await this.addEvent(
      uid,
      actorUserId,
      'STARTED',
      from,
      'IN_PROGRESS',
      'Work started',
    );
    return this.findOne(uid);
  }

  async complete(
    uid: string,
    dto: CompleteWorkOrderDto,
    actorUserId: string,
  ): Promise<WorkOrderResponse> {
    const order = await this.getEntity(uid);
    if (order.status !== 'IN_PROGRESS' && order.status !== 'ON_HOLD') {
      throw new BadRequestException(
        'Only IN_PROGRESS or ON_HOLD work orders can be completed',
      );
    }
    const from = order.status;
    order.status = 'COMPLETED';
    order.completedAt = new Date();
    if (dto.actualCost != null) order.actualCost = String(dto.actualCost);
    if (dto.resolutionNotes !== undefined) {
      order.resolutionNotes = dto.resolutionNotes?.trim() || null;
    }
    await this.ordersRepo.save(order);
    await this.addEvent(
      uid,
      actorUserId,
      'COMPLETED',
      from,
      'COMPLETED',
      dto.resolutionNotes?.trim() || 'Work completed',
    );
    this.notifications.notifySafe({
      userIds: [order.requestedByUserId],
      societyId: order.societyId,
      type: 'WORK_ORDER_COMPLETED',
      title: 'Work order completed',
      body: order.title,
      payload: { workOrderId: order.uid },
      sourceService: 'core',
    });
    return this.findOne(uid);
  }

  async verify(uid: string, actorUserId: string): Promise<WorkOrderResponse> {
    const order = await this.getEntity(uid);
    if (order.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Only COMPLETED work orders can be verified',
      );
    }
    order.status = 'VERIFIED';
    order.verifiedAt = new Date();
    order.verifiedByUserId = actorUserId;
    await this.ordersRepo.save(order);
    await this.addEvent(
      uid,
      actorUserId,
      'VERIFIED',
      'COMPLETED',
      'VERIFIED',
      'Work verified by admin',
    );
    return this.findOne(uid);
  }

  async hold(
    uid: string,
    dto: HoldOrCancelWorkOrderDto,
    actorUserId: string,
  ): Promise<WorkOrderResponse> {
    const order = await this.getEntity(uid);
    if (!['ASSIGNED', 'IN_PROGRESS'].includes(order.status)) {
      throw new BadRequestException(
        'Only ASSIGNED or IN_PROGRESS work orders can be put on hold',
      );
    }
    const from = order.status;
    order.status = 'ON_HOLD';
    await this.ordersRepo.save(order);
    await this.addEvent(
      uid,
      actorUserId,
      'ON_HOLD',
      from,
      'ON_HOLD',
      dto.reason?.trim() || 'Work put on hold',
    );
    return this.findOne(uid);
  }

  async cancel(
    uid: string,
    dto: HoldOrCancelWorkOrderDto,
    actorUserId: string,
  ): Promise<WorkOrderResponse> {
    const order = await this.getEntity(uid);
    if (['COMPLETED', 'VERIFIED', 'CANCELLED'].includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel work order in status ${order.status}`,
      );
    }
    const from = order.status;
    order.status = 'CANCELLED';
    await this.ordersRepo.save(order);
    await this.addEvent(
      uid,
      actorUserId,
      'CANCELLED',
      from,
      'CANCELLED',
      dto.reason?.trim() || 'Work order cancelled',
    );
    return this.findOne(uid);
  }

  async proposeQuote(
    workOrderId: string,
    dto: ProposeQuoteDto,
    actorUserId: string,
  ): Promise<QuoteResponse> {
    const order = await this.getEntity(workOrderId);
    if (!['OPEN', 'QUOTED'].includes(order.status)) {
      throw new BadRequestException(
        'Quotes can only be proposed for OPEN or QUOTED work orders',
      );
    }
    await this.vendorsService.assertActiveForSociety(
      dto.vendorId,
      order.societyId,
    );
    const quote = await this.quotesRepo.save(
      this.quotesRepo.create({
        workOrderId,
        vendorId: dto.vendorId,
        amount: String(dto.amount),
        notes: dto.notes?.trim() || null,
        status: 'PROPOSED',
        proposedByUserId: actorUserId,
      }),
    );
    if (order.status === 'OPEN') {
      order.status = 'QUOTED';
      await this.ordersRepo.save(order);
    }
    await this.addEvent(
      workOrderId,
      actorUserId,
      'QUOTE_PROPOSED',
      order.status,
      order.status,
      `Quote ${dto.amount} from vendor ${dto.vendorId}`,
    );
    return toQuoteResponse(quote);
  }

  async decideQuote(
    uid: string,
    dto: DecideQuoteDto,
    actorUserId: string,
  ): Promise<QuoteResponse> {
    const quote = await this.quotesRepo.findOne({ where: { uid } });
    if (!quote) throw new NotFoundException(`Quote ${uid} not found`);
    if (quote.status !== 'PROPOSED') {
      throw new BadRequestException('Quote is not awaiting decision');
    }
    const order = await this.getEntity(quote.workOrderId);
    if (dto.accept) {
      quote.status = 'ACCEPTED';
      quote.decidedAt = new Date();
      await this.quotesRepo.save(quote);

      const others = await this.quotesRepo.find({
        where: { workOrderId: order.uid, status: 'PROPOSED' },
      });
      for (const other of others) {
        if (other.uid === quote.uid) continue;
        other.status = 'REJECTED';
        other.decidedAt = new Date();
        await this.quotesRepo.save(other);
      }

      await this.vendorsService.assertActiveForSociety(
        quote.vendorId,
        order.societyId,
      );
      const from = order.status;
      order.assignedVendorId = quote.vendorId;
      order.status = 'ASSIGNED';
      order.costEstimate = quote.amount;
      await this.ordersRepo.save(order);
      await this.addEvent(
        order.uid,
        actorUserId,
        'QUOTE_ACCEPTED',
        from,
        'ASSIGNED',
        dto.notes?.trim() || `Accepted quote ${quote.uid}`,
      );
    } else {
      quote.status = 'REJECTED';
      quote.decidedAt = new Date();
      await this.quotesRepo.save(quote);
      await this.addEvent(
        order.uid,
        actorUserId,
        'QUOTE_REJECTED',
        order.status,
        order.status,
        dto.notes?.trim() || `Rejected quote ${quote.uid}`,
      );
    }
    return toQuoteResponse(quote);
  }

  async listQuotes(workOrderId: string): Promise<QuoteResponse[]> {
    await this.getEntity(workOrderId);
    const rows = await this.quotesRepo.find({
      where: { workOrderId },
      order: { createdAt: 'DESC' },
    });
    return rows.map(toQuoteResponse);
  }

  async listEvents(workOrderId: string): Promise<EventResponse[]> {
    await this.getEntity(workOrderId);
    const rows = await this.eventsRepo.find({
      where: { workOrderId },
      order: { createdAt: 'ASC' },
    });
    return rows.map(toEventResponse);
  }

  async getEntity(uid: string): Promise<WorkOrder> {
    const order = await this.ordersRepo.findOne({ where: { uid } });
    if (!order) throw new NotFoundException(`Work order ${uid} not found`);
    return order;
  }

  private async addEvent(
    workOrderId: string,
    actorUserId: string,
    eventType: string,
    fromStatus: string | null,
    toStatus: string | null,
    message: string,
  ) {
    await this.eventsRepo.save(
      this.eventsRepo.create({
        workOrderId,
        actorUserId,
        eventType,
        fromStatus,
        toStatus,
        message,
      }),
    );
  }
}
