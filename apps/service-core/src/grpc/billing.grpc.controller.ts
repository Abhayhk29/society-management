import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { BillsService } from '../billing/bills.service.js';
import {
  BillResponse,
  PaymentResponse,
  ReceiptResponse,
} from '../billing/billing.mapper.js';
import { PaymentsService } from '../billing/payments.service.js';
import { ReceiptsService } from '../billing/receipts.service.js';
import { dateToString, toRpcException } from './grpc-exception.util.js';

function mapBill(bill: BillResponse) {
  return {
    uid: bill.uid,
    societyId: bill.societyId,
    flatId: bill.flatId ?? '',
    hasFlatId: bill.flatId !== null,
    membershipId: bill.membershipId ?? '',
    hasMembershipId: bill.membershipId !== null,
    title: bill.title,
    category: bill.category,
    amount: bill.amount,
    currency: bill.currency,
    dueDate: bill.dueDate,
    status: bill.status,
    issuedAt: dateToString(bill.issuedAt),
    notes: bill.notes ?? '',
    createdByUserId: bill.createdByUserId,
    paidAmount: bill.paidAmount,
    createdAt: dateToString(bill.createdAt),
    updatedAt: dateToString(bill.updatedAt),
  };
}

function mapPayment(payment: PaymentResponse) {
  return {
    uid: payment.uid,
    billId: payment.billId,
    amount: payment.amount,
    method: payment.method,
    reference: payment.reference ?? '',
    paidByUserId: payment.paidByUserId,
    paidAt: dateToString(payment.paidAt),
    status: payment.status,
    receiptId: payment.receiptId ?? '',
    receiptNumber: payment.receiptNumber ?? '',
    hasReceipt: Boolean(payment.receiptId),
    createdAt: dateToString(payment.createdAt),
  };
}

function mapReceipt(receipt: ReceiptResponse) {
  return {
    uid: receipt.uid,
    paymentId: receipt.paymentId,
    billId: receipt.billId,
    societyId: receipt.societyId,
    receiptNumber: receipt.receiptNumber,
    issuedAt: dateToString(receipt.issuedAt),
    snapshotJson: receipt.snapshotJson,
    createdAt: dateToString(receipt.createdAt),
  };
}

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BillGrpcController {
  constructor(private readonly billsService: BillsService) {}

  @GrpcMethod('BillService', 'CreateBill')
  @RequirePermissions('create:bills')
  async createBill(data: {
    societyId: string;
    flatId?: string;
    membershipId?: string;
    title: string;
    category?: string;
    amount: number;
    currency?: string;
    dueDate: string;
    notes?: string;
    issueNow?: boolean;
    actorUserId: string;
    hasFlatId?: boolean;
    hasMembershipId?: boolean;
  }) {
    try {
      return mapBill(
        await this.billsService.create(
          {
            societyId: data.societyId,
            flatId: data.hasFlatId ? data.flatId : undefined,
            membershipId: data.hasMembershipId ? data.membershipId : undefined,
            title: data.title,
            category: (data.category as 'OTHER') || 'OTHER',
            amount: data.amount,
            currency: data.currency || 'INR',
            dueDate: data.dueDate,
            notes: data.notes || undefined,
            issueNow: data.issueNow !== false,
          },
          data.actorUserId,
        ),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('BillService', 'ListBills')
  @RequirePermissions('view:bills')
  async listBills(data: {
    societyId: string;
    status?: string;
    hasStatus?: boolean;
  }) {
    try {
      const bills = await this.billsService.findBySociety(
        data.societyId,
        data.hasStatus ? data.status : undefined,
      );
      return { bills: bills.map(mapBill) };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('BillService', 'GetBill')
  @RequirePermissions('view:bills')
  async getBill(data: { uid: string }) {
    try {
      return mapBill(await this.billsService.findOne(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('BillService', 'UpdateBill')
  @RequirePermissions('create:bills')
  async updateBill(data: {
    uid: string;
    title?: string;
    category?: string;
    amount?: number;
    dueDate?: string;
    notes?: string;
    hasTitle?: boolean;
    hasCategory?: boolean;
    hasAmount?: boolean;
    hasDueDate?: boolean;
    hasNotes?: boolean;
    clearNotes?: boolean;
  }) {
    try {
      return mapBill(
        await this.billsService.update(data.uid, {
          title: data.hasTitle ? data.title : undefined,
          category: data.hasCategory ? (data.category as 'OTHER') : undefined,
          amount: data.hasAmount ? data.amount : undefined,
          dueDate: data.hasDueDate ? data.dueDate : undefined,
          notes: data.clearNotes
            ? null
            : data.hasNotes
              ? data.notes
              : undefined,
        }),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('BillService', 'CancelBill')
  @RequirePermissions('create:bills')
  async cancelBill(data: { uid: string }) {
    try {
      return mapBill(await this.billsService.cancel(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('BillService', 'IssueBill')
  @RequirePermissions('create:bills')
  async issueBill(data: { uid: string }) {
    try {
      return mapBill(await this.billsService.issue(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }
}

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PaymentGrpcController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @GrpcMethod('PaymentService', 'PayBill')
  @RequirePermissions('pay:bills')
  async payBill(data: {
    billId: string;
    amount: number;
    method: string;
    reference?: string;
    actorUserId: string;
  }) {
    try {
      return mapPayment(
        await this.paymentsService.pay(
          data.billId,
          {
            amount: data.amount,
            method: data.method as 'MANUAL',
            reference: data.reference || undefined,
          },
          data.actorUserId,
        ),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('PaymentService', 'ListPaymentsByBill')
  @RequirePermissions('view:bills')
  async listPaymentsByBill(data: { uid: string }) {
    try {
      const payments = await this.paymentsService.listByBill(data.uid);
      return { payments: payments.map(mapPayment) };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('PaymentService', 'GetPayment')
  @RequirePermissions('view:bills')
  async getPayment(data: { uid: string }) {
    try {
      return mapPayment(await this.paymentsService.findOne(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }
}

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReceiptGrpcController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @GrpcMethod('ReceiptService', 'GetReceipt')
  @RequirePermissions('view:bills')
  async getReceipt(data: { uid: string }) {
    try {
      return mapReceipt(await this.receiptsService.findOne(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('ReceiptService', 'GetReceiptByPayment')
  @RequirePermissions('view:bills')
  async getReceiptByPayment(data: { uid: string }) {
    try {
      return mapReceipt(await this.receiptsService.findByPayment(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('ReceiptService', 'ListReceiptsBySociety')
  @RequirePermissions('view:bills')
  async listReceiptsBySociety(data: { societyId: string }) {
    try {
      const receipts = await this.receiptsService.listBySociety(data.societyId);
      return { receipts: receipts.map(mapReceipt) };
    } catch (error) {
      throw toRpcException(error);
    }
  }
}
