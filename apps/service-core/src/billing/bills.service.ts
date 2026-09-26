import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service.js';
import { SocietiesService } from '../society/societies.service.js';
import { BillResponse, toBillResponse } from './billing.mapper.js';
import { CreateBillDto, UpdateBillDto } from './dto/billing.dto.js';
import { Bill } from './entities/bill.entity.js';
import { Payment } from './entities/payment.entity.js';

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill) private readonly billsRepo: Repository<Bill>,
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
    private readonly societiesService: SocietiesService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(dto: CreateBillDto, actorUserId: string): Promise<BillResponse> {
    await this.societiesService.getEntity(dto.societyId);
    const issueNow = dto.issueNow !== false;
    const bill = await this.billsRepo.save(
      this.billsRepo.create({
        societyId: dto.societyId,
        flatId: dto.flatId ?? null,
        membershipId: dto.membershipId ?? null,
        title: dto.title.trim(),
        category: dto.category ?? 'OTHER',
        amount: dto.amount,
        currency: dto.currency ?? 'INR',
        dueDate: dto.dueDate.slice(0, 10),
        status: issueNow ? 'ISSUED' : 'DRAFT',
        issuedAt: issueNow ? new Date() : null,
        notes: dto.notes?.trim() || null,
        createdByUserId: actorUserId,
      }),
    );
    if (issueNow) {
      this.notifications.notifySafe({
        societyId: bill.societyId,
        excludeUserIds: [actorUserId],
        type: 'BILL_ISSUED',
        title: 'New bill issued',
        body: `${bill.title} · ${bill.currency} ${bill.amount} due ${bill.dueDate}`,
        payload: { billId: bill.uid },
        sourceService: 'core',
      });
    }
    return toBillResponse(bill, 0);
  }

  async findBySociety(
    societyId: string,
    status?: string,
  ): Promise<BillResponse[]> {
    await this.societiesService.getEntity(societyId);
    const bills = await this.billsRepo.find({
      where: status
        ? { societyId, status: status as Bill['status'] }
        : { societyId },
      order: { createdAt: 'DESC' },
    });
    return Promise.all(
      bills.map(async (bill) =>
        toBillResponse(bill, await this.paidAmount(bill.uid)),
      ),
    );
  }

  async findOne(uid: string): Promise<BillResponse> {
    const bill = await this.getEntity(uid);
    return toBillResponse(bill, await this.paidAmount(uid));
  }

  async update(uid: string, dto: UpdateBillDto): Promise<BillResponse> {
    const bill = await this.getEntity(uid);
    if (bill.status === 'PAID' || bill.status === 'CANCELLED') {
      throw new BadRequestException(
        `Cannot update bill in status ${bill.status}`,
      );
    }
    if (dto.title !== undefined) bill.title = dto.title.trim();
    if (dto.category !== undefined) bill.category = dto.category;
    if (dto.amount !== undefined) bill.amount = dto.amount;
    if (dto.dueDate !== undefined) bill.dueDate = dto.dueDate.slice(0, 10);
    if (dto.notes !== undefined) bill.notes = dto.notes?.trim() || null;
    await this.billsRepo.save(bill);
    return this.findOne(uid);
  }

  async issue(uid: string): Promise<BillResponse> {
    const bill = await this.getEntity(uid);
    if (bill.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT bills can be issued');
    }
    bill.status = 'ISSUED';
    bill.issuedAt = new Date();
    await this.billsRepo.save(bill);
    this.notifications.notifySafe({
      societyId: bill.societyId,
      excludeUserIds: [bill.createdByUserId],
      type: 'BILL_ISSUED',
      title: 'New bill issued',
      body: `${bill.title} · ${bill.currency} ${bill.amount} due ${bill.dueDate}`,
      payload: { billId: bill.uid },
      sourceService: 'core',
    });
    return this.findOne(uid);
  }

  async cancel(uid: string): Promise<BillResponse> {
    const bill = await this.getEntity(uid);
    if (bill.status === 'PAID') {
      throw new BadRequestException('Cannot cancel a paid bill');
    }
    bill.status = 'CANCELLED';
    await this.billsRepo.save(bill);
    return this.findOne(uid);
  }

  async getEntity(uid: string): Promise<Bill> {
    const bill = await this.billsRepo.findOne({ where: { uid } });
    if (!bill) throw new NotFoundException(`Bill ${uid} not found`);
    return bill;
  }

  async paidAmount(billId: string): Promise<number> {
    const rows = await this.paymentsRepo.find({
      where: { bill: { uid: billId }, status: 'SUCCESS' },
    });
    return rows.reduce((sum, p) => sum + Number(p.amount), 0);
  }

  async refreshStatus(billId: string): Promise<Bill> {
    const bill = await this.getEntity(billId);
    if (bill.status === 'CANCELLED' || bill.status === 'DRAFT') return bill;
    const paid = await this.paidAmount(billId);
    if (paid <= 0) {
      bill.status = 'ISSUED';
    } else if (paid + 0.001 >= Number(bill.amount)) {
      bill.status = 'PAID';
    } else {
      bill.status = 'PARTIALLY_PAID';
    }
    return this.billsRepo.save(bill);
  }
}
