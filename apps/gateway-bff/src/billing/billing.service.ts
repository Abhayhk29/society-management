import { Metadata } from '@grpc/grpc-js';
import { Inject, Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Request } from 'express';
import { firstValueFrom, Observable } from 'rxjs';
import { BILL_SERVICE, PAYMENT_SERVICE, RECEIPT_SERVICE } from 'shared-protos';
import type { GatewayAuthUser } from '../auth/auth-user.type.js';
import { CORE_GRPC } from '../grpc/grpc-clients.module.js';
import { mapGrpcError } from '../grpc/grpc-error.util.js';

type GrpcUnary<TReq, TRes> = (
  data: TReq,
  metadata?: Metadata,
) => Observable<TRes>;

@Injectable({ scope: Scope.REQUEST })
export class BillingGatewayService implements OnModuleInit {
  private bills!: Record<string, GrpcUnary<unknown, unknown>>;
  private payments!: Record<string, GrpcUnary<unknown, unknown>>;
  private receipts!: Record<string, GrpcUnary<unknown, unknown>>;

  constructor(
    @Inject(CORE_GRPC) private readonly core: ClientGrpc,
    @Inject(REQUEST)
    private readonly request: Request & { user?: GatewayAuthUser },
  ) {}

  onModuleInit() {
    this.bills = this.core.getService(BILL_SERVICE);
    this.payments = this.core.getService(PAYMENT_SERVICE);
    this.receipts = this.core.getService(RECEIPT_SERVICE);
  }

  private meta() {
    const metadata = new Metadata();
    const header = this.request.headers?.authorization;
    if (header) metadata.set('authorization', String(header));
    return metadata;
  }

  private actor() {
    return {
      actorUserId: this.request.user?.uid ?? '',
    };
  }

  private async call<T>(fn: (m: Metadata) => Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(fn(this.meta()));
    } catch (error) {
      mapGrpcError(error);
    }
  }

  createBill(body: Record<string, unknown>) {
    return this.call((m) =>
      this.bills.createBill(
        {
          ...this.actor(),
          societyId: body.societyId,
          flatId: body.flatId ?? '',
          hasFlatId: body.flatId != null,
          membershipId: body.membershipId ?? '',
          hasMembershipId: body.membershipId != null,
          title: body.title,
          category: body.category ?? 'OTHER',
          amount: body.amount,
          currency: body.currency ?? 'INR',
          dueDate: body.dueDate,
          notes: body.notes ?? '',
          issueNow: body.issueNow !== false,
        },
        m,
      ),
    );
  }

  async listBills(societyId: string, status?: string) {
    const res = (await this.call((m) =>
      this.bills.listBills(
        { societyId, status: status ?? '', hasStatus: Boolean(status) },
        m,
      ),
    )) as { bills?: unknown[] };
    return res.bills ?? [];
  }

  getBill(uid: string) {
    return this.call((m) => this.bills.getBill({ uid }, m));
  }

  updateBill(uid: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.bills.updateBill(
        {
          uid,
          title: body.title ?? '',
          category: body.category ?? '',
          amount: body.amount ?? 0,
          dueDate: body.dueDate ?? '',
          notes: body.notes ?? '',
          hasTitle: body.title !== undefined,
          hasCategory: body.category !== undefined,
          hasAmount: body.amount !== undefined,
          hasDueDate: body.dueDate !== undefined,
          hasNotes: body.notes !== undefined && body.notes !== null,
          clearNotes: body.notes === null,
        },
        m,
      ),
    );
  }

  issueBill(uid: string) {
    return this.call((m) => this.bills.issueBill({ uid }, m));
  }

  cancelBill(uid: string) {
    return this.call((m) => this.bills.cancelBill({ uid }, m));
  }

  payBill(billId: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.payments.payBill(
        {
          billId,
          amount: body.amount,
          method: body.method,
          reference: body.reference ?? '',
          ...this.actor(),
        },
        m,
      ),
    );
  }

  async listPayments(billId: string) {
    const res = (await this.call((m) =>
      this.payments.listPaymentsByBill({ uid: billId }, m),
    )) as { payments?: unknown[] };
    return res.payments ?? [];
  }

  getPayment(uid: string) {
    return this.call((m) => this.payments.getPayment({ uid }, m));
  }

  getReceipt(uid: string) {
    return this.call((m) => this.receipts.getReceipt({ uid }, m));
  }

  getReceiptByPayment(paymentId: string) {
    return this.call((m) =>
      this.receipts.getReceiptByPayment({ uid: paymentId }, m),
    );
  }

  async listReceipts(societyId: string) {
    const res = (await this.call((m) =>
      this.receipts.listReceiptsBySociety({ societyId }, m),
    )) as { receipts?: unknown[] };
    return res.receipts ?? [];
  }
}
