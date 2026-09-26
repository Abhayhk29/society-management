import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { ReceiptResponse, toReceiptResponse } from './billing.mapper.js';
import { Payment } from './entities/payment.entity.js';
import { Receipt } from './entities/receipt.entity.js';

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(Receipt)
    private readonly receiptsRepo: Repository<Receipt>,
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
  ) {}

  async createForPayment(paymentId: string): Promise<Receipt> {
    const existing = await this.receiptsRepo.findOne({
      where: { payment: { uid: paymentId } },
    });
    if (existing) return existing;

    const payment = await this.paymentsRepo.findOne({
      where: { uid: paymentId },
      relations: { bill: true },
    });
    if (!payment?.bill) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = randomBytes(2).toString('hex').toUpperCase();
    const receiptNumber = `RCPT-${day}-${suffix}`;

    const snapshot = {
      bill: {
        uid: payment.bill.uid,
        title: payment.bill.title,
        amount: Number(payment.bill.amount),
        currency: payment.bill.currency,
        societyId: payment.bill.societyId,
      },
      payment: {
        uid: payment.uid,
        amount: Number(payment.amount),
        method: payment.method,
        reference: payment.reference,
        paidAt: payment.paidAt,
        paidByUserId: payment.paidByUserId,
      },
    };

    return this.receiptsRepo.save(
      this.receiptsRepo.create({
        payment,
        billId: payment.bill.uid,
        societyId: payment.bill.societyId,
        receiptNumber,
        issuedAt: new Date(),
        snapshotJson: JSON.stringify(snapshot),
      }),
    );
  }

  async findOne(uid: string): Promise<ReceiptResponse> {
    const receipt = await this.receiptsRepo.findOne({ where: { uid } });
    if (!receipt) throw new NotFoundException(`Receipt ${uid} not found`);
    return toReceiptResponse(receipt);
  }

  async findByPayment(paymentId: string): Promise<ReceiptResponse> {
    const receipt = await this.receiptsRepo.findOne({
      where: { payment: { uid: paymentId } },
    });
    if (!receipt) {
      throw new NotFoundException(`Receipt for payment ${paymentId} not found`);
    }
    return toReceiptResponse(receipt);
  }

  async listBySociety(societyId: string): Promise<ReceiptResponse[]> {
    const rows = await this.receiptsRepo.find({
      where: { societyId },
      order: { issuedAt: 'DESC' },
      take: 200,
    });
    return rows.map(toReceiptResponse);
  }
}
