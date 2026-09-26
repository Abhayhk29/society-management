import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service.js';
import { PaymentResponse, toPaymentResponse } from './billing.mapper.js';
import { BillsService } from './bills.service.js';
import { PayBillDto } from './dto/billing.dto.js';
import { Payment } from './entities/payment.entity.js';
import { ReceiptsService } from './receipts.service.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
    private readonly billsService: BillsService,
    private readonly receiptsService: ReceiptsService,
    private readonly notifications: NotificationsService,
  ) {}

  async pay(
    billId: string,
    dto: PayBillDto,
    actorUserId: string,
  ): Promise<PaymentResponse> {
    const bill = await this.billsService.getEntity(billId);
    if (
      bill.status === 'DRAFT' ||
      bill.status === 'CANCELLED' ||
      bill.status === 'PAID'
    ) {
      throw new BadRequestException(`Cannot pay bill in status ${bill.status}`);
    }

    const paidSoFar = await this.billsService.paidAmount(billId);
    const remaining = Number(bill.amount) - paidSoFar;
    if (dto.amount > remaining + 0.001) {
      throw new BadRequestException(
        `Payment exceeds remaining balance (${remaining.toFixed(2)})`,
      );
    }

    const payment = await this.paymentsRepo.save(
      this.paymentsRepo.create({
        bill,
        amount: dto.amount,
        method: dto.method,
        reference: dto.reference?.trim() || null,
        paidByUserId: actorUserId,
        paidAt: new Date(),
        status: 'SUCCESS',
      }),
    );

    await this.billsService.refreshStatus(billId);
    const receipt = await this.receiptsService.createForPayment(payment.uid);
    payment.receipt = receipt;

    const recipients = new Set<string>([actorUserId, bill.createdByUserId]);
    this.notifications.notifySafe({
      userIds: [...recipients],
      societyId: bill.societyId,
      type: 'PAYMENT_RECORDED',
      title: 'Payment recorded',
      body: `Payment of ${bill.currency} ${dto.amount} for ${bill.title} (${dto.method})`,
      payload: {
        billId: bill.uid,
        paymentId: payment.uid,
        receiptNumber: receipt.receiptNumber,
      },
      sourceService: 'core',
    });

    return toPaymentResponse(payment);
  }

  async listByBill(billId: string): Promise<PaymentResponse[]> {
    await this.billsService.getEntity(billId);
    const rows = await this.paymentsRepo.find({
      where: { bill: { uid: billId } },
      relations: { receipt: true },
      order: { paidAt: 'DESC' },
    });
    return rows.map(toPaymentResponse);
  }

  async findOne(uid: string): Promise<PaymentResponse> {
    const payment = await this.paymentsRepo.findOne({
      where: { uid },
      relations: { receipt: true, bill: true },
    });
    if (!payment) throw new NotFoundException(`Payment ${uid} not found`);
    return toPaymentResponse(payment);
  }

  async getEntity(uid: string): Promise<Payment> {
    const payment = await this.paymentsRepo.findOne({
      where: { uid },
      relations: { bill: true, receipt: true },
    });
    if (!payment) throw new NotFoundException(`Payment ${uid} not found`);
    return payment;
  }
}
