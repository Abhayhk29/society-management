import { Bill } from './entities/bill.entity.js';
import { Payment } from './entities/payment.entity.js';
import { Receipt } from './entities/receipt.entity.js';

export type BillResponse = {
  uid: string;
  societyId: string;
  flatId: string | null;
  membershipId: string | null;
  title: string;
  category: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: string;
  issuedAt: Date | null;
  notes: string | null;
  createdByUserId: string;
  paidAmount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentResponse = {
  uid: string;
  billId: string;
  amount: number;
  method: string;
  reference: string | null;
  paidByUserId: string;
  paidAt: Date;
  status: string;
  receiptId?: string;
  receiptNumber?: string;
  createdAt: Date;
};

export type ReceiptResponse = {
  uid: string;
  paymentId: string;
  billId: string;
  societyId: string;
  receiptNumber: string;
  issuedAt: Date;
  snapshotJson: string;
  createdAt: Date;
};

export function toBillResponse(bill: Bill, paidAmount = 0): BillResponse {
  return {
    uid: bill.uid,
    societyId: bill.societyId,
    flatId: bill.flatId,
    membershipId: bill.membershipId,
    title: bill.title,
    category: bill.category,
    amount: Number(bill.amount),
    currency: bill.currency,
    dueDate: String(bill.dueDate).slice(0, 10),
    status: bill.status,
    issuedAt: bill.issuedAt,
    notes: bill.notes,
    createdByUserId: bill.createdByUserId,
    paidAmount,
    createdAt: bill.createdAt,
    updatedAt: bill.updatedAt,
  };
}

export function toPaymentResponse(payment: Payment): PaymentResponse {
  return {
    uid: payment.uid,
    billId: payment.billId ?? payment.bill?.uid,
    amount: Number(payment.amount),
    method: payment.method,
    reference: payment.reference,
    paidByUserId: payment.paidByUserId,
    paidAt: payment.paidAt,
    status: payment.status,
    receiptId: payment.receipt?.uid,
    receiptNumber: payment.receipt?.receiptNumber,
    createdAt: payment.createdAt,
  };
}

export function toReceiptResponse(receipt: Receipt): ReceiptResponse {
  return {
    uid: receipt.uid,
    paymentId: receipt.paymentId ?? receipt.payment?.uid,
    billId: receipt.billId,
    societyId: receipt.societyId,
    receiptNumber: receipt.receiptNumber,
    issuedAt: receipt.issuedAt,
    snapshotJson: receipt.snapshotJson,
    createdAt: receipt.createdAt,
  };
}
