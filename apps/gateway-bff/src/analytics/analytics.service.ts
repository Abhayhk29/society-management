import { Metadata } from '@grpc/grpc-js';
import { Inject, Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Request } from 'express';
import { firstValueFrom, Observable } from 'rxjs';
import {
  BILL_SERVICE,
  COMPLAINT_SERVICE,
  INSIGHTS_SERVICE,
  RECEIPT_PDF_SERVICE,
  RECEIPT_SERVICE,
  SOCIETY_SERVICE,
  VISITOR_SERVICE,
  WORK_ORDER_SERVICE,
} from 'shared-protos';
import type { GatewayAuthUser } from '../auth/auth-user.type.js';
import { ANALYTICS_GRPC, CORE_GRPC } from '../grpc/grpc-clients.module.js';
import { mapGrpcError } from '../grpc/grpc-error.util.js';

type GrpcUnary<TReq, TRes> = (
  data: TReq,
  metadata?: Metadata,
) => Observable<TRes>;

@Injectable({ scope: Scope.REQUEST })
export class AnalyticsGatewayService implements OnModuleInit {
  private receiptPdf!: Record<string, GrpcUnary<unknown, unknown>>;
  private insights!: Record<string, GrpcUnary<unknown, unknown>>;
  private receipts!: Record<string, GrpcUnary<unknown, unknown>>;
  private bills!: Record<string, GrpcUnary<unknown, unknown>>;
  private complaints!: Record<string, GrpcUnary<unknown, unknown>>;
  private workOrders!: Record<string, GrpcUnary<unknown, unknown>>;
  private visitors!: Record<string, GrpcUnary<unknown, unknown>>;
  private societies!: Record<string, GrpcUnary<unknown, unknown>>;

  constructor(
    @Inject(ANALYTICS_GRPC) private readonly analytics: ClientGrpc,
    @Inject(CORE_GRPC) private readonly core: ClientGrpc,
    @Inject(REQUEST)
    private readonly request: Request & { user?: GatewayAuthUser },
  ) {}

  onModuleInit() {
    this.receiptPdf = this.analytics.getService(RECEIPT_PDF_SERVICE);
    this.insights = this.analytics.getService(INSIGHTS_SERVICE);
    this.receipts = this.core.getService(RECEIPT_SERVICE);
    this.bills = this.core.getService(BILL_SERVICE);
    this.complaints = this.core.getService(COMPLAINT_SERVICE);
    this.workOrders = this.core.getService(WORK_ORDER_SERVICE);
    this.visitors = this.core.getService(VISITOR_SERVICE);
    this.societies = this.core.getService(SOCIETY_SERVICE);
  }

  private meta() {
    const metadata = new Metadata();
    const header = this.request.headers?.authorization;
    if (header) metadata.set('authorization', String(header));
    return metadata;
  }

  private async call<T>(fn: (m: Metadata) => Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(fn(this.meta()));
    } catch (error) {
      mapGrpcError(error);
    }
  }

  async receiptPdfById(receiptUid: string) {
    const receipt = (await this.call((m) =>
      this.receipts.getReceipt({ uid: receiptUid }, m),
    )) as {
      receiptNumber?: string;
      issuedAt?: string;
      societyId?: string;
      snapshotJson?: string;
    };

    const pdf = (await this.call((m) =>
      this.receiptPdf.generateReceiptPdf(
        {
          receiptNumber: receipt.receiptNumber ?? '',
          issuedAt: receipt.issuedAt ?? '',
          societyId: receipt.societyId ?? '',
          snapshotJson: receipt.snapshotJson ?? '{}',
          brandName: 'Nivas',
        },
        m,
      ),
    )) as {
      pdfBytes?: Buffer | Uint8Array | string;
      filename?: string;
      contentType?: string;
    };

    return {
      filename: pdf.filename || `${receipt.receiptNumber || 'receipt'}.pdf`,
      contentType: pdf.contentType || 'application/pdf',
      pdfBytes: this.toBuffer(pdf.pdfBytes),
    };
  }

  async societyInsights(societyId: string) {
    const society = (await this.call((m) =>
      this.societies.getSociety({ uid: societyId }, m),
    )) as { name?: string };

    const [billsRes, complaintsRes, workOrdersRes, visitorsRes] =
      await Promise.all([
        this.call((m) =>
          this.bills.listBills({ societyId, status: '', hasStatus: false }, m),
        ) as Promise<{ bills?: Array<Record<string, unknown>> }>,
        this.call((m) =>
          this.complaints.listComplaints(
            { societyId, status: '', hasStatus: false },
            m,
          ),
        ) as Promise<{ complaints?: Array<Record<string, unknown>> }>,
        this.call((m) =>
          this.workOrders.listWorkOrders(
            {
              societyId,
              status: '',
              hasStatus: false,
              vendorId: '',
              hasVendorId: false,
              category: '',
              hasCategory: false,
            },
            m,
          ),
        ) as Promise<{ workOrders?: Array<Record<string, unknown>> }>,
        this.call((m) =>
          this.visitors.listVisitors(
            { societyId, status: '', hasStatus: false },
            m,
          ),
        ) as Promise<{ visitors?: Array<Record<string, unknown>> }>,
      ]);

    const bills = billsRes.bills ?? [];
    const complaints = complaintsRes.complaints ?? [];
    const workOrders = workOrdersRes.workOrders ?? [];
    const visitors = visitorsRes.visitors ?? [];

    let revenueCollected = 0;
    let revenueOutstanding = 0;
    let billsPaid = 0;
    let billsOverdue = 0;
    for (const bill of bills) {
      const amount = Number(bill.amount ?? 0);
      const paid = Number(bill.paidAmount ?? 0);
      const status = String(bill.status ?? '');
      if (status === 'PAID') billsPaid += 1;
      if (status === 'OVERDUE') billsOverdue += 1;
      revenueCollected += paid;
      if (status !== 'CANCELLED' && status !== 'DRAFT') {
        revenueOutstanding += Math.max(0, amount - paid);
      }
    }

    return this.call((m) =>
      this.insights.generateSocietyInsights(
        {
          societyId,
          societyName: society.name ?? 'Society',
          billsTotal: bills.length,
          billsPaid,
          billsOverdue,
          revenueCollected,
          revenueOutstanding,
          complaintsOpen: complaints.filter((c) => c.status === 'OPEN').length,
          complaintsResolved: complaints.filter(
            (c) => c.status === 'RESOLVED' || c.status === 'CLOSED',
          ).length,
          workOrdersOpen: workOrders.filter((w) =>
            ['OPEN', 'QUOTED', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD'].includes(
              String(w.status),
            ),
          ).length,
          workOrdersCompleted: workOrders.filter((w) =>
            ['COMPLETED', 'VERIFIED'].includes(String(w.status)),
          ).length,
          visitorsExpected: visitors.filter((v) => v.status === 'EXPECTED')
            .length,
          periodLabel: 'current snapshot',
        },
        m,
      ),
    );
  }

  private toBuffer(value: Buffer | Uint8Array | string | undefined): Buffer {
    if (!value) return Buffer.alloc(0);
    if (Buffer.isBuffer(value)) return value;
    if (value instanceof Uint8Array) return Buffer.from(value);
    return Buffer.from(value, 'base64');
  }
}
