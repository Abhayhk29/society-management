import { VendorDocument } from './entities/vendor-document.entity.js';
import { VendorSociety } from './entities/vendor-society.entity.js';
import { Vendor } from './entities/vendor.entity.js';
import { WorkOrderEvent } from './entities/work-order-event.entity.js';
import { WorkOrderQuote } from './entities/work-order-quote.entity.js';
import { WorkOrder } from './entities/work-order.entity.js';

export type VendorResponse = {
  uid: string;
  displayName: string;
  companyName: string;
  contactPhone: string | null;
  contactEmail: string | null;
  categories: string;
  status: string;
  gstNumber: string | null;
  panNumber: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  userId: string | null;
  createdByUserId: string;
  reviewedByUserId: string | null;
  reviewedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type VendorDocumentResponse = {
  uid: string;
  vendorId: string;
  docType: string;
  label: string;
  referenceOrUrl: string;
  status: string;
  notes: string | null;
  verifiedByUserId: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type VendorSocietyResponse = {
  uid: string;
  vendorId: string;
  societyId: string;
  status: string;
  notes: string | null;
  approvedByUserId: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkOrderResponse = {
  uid: string;
  societyId: string;
  flatId: string | null;
  buildingId: string | null;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  requestedByUserId: string;
  assignedVendorId: string | null;
  complaintId: string | null;
  scheduledStartAt: Date | null;
  scheduledEndAt: Date | null;
  completedAt: Date | null;
  verifiedAt: Date | null;
  verifiedByUserId: string | null;
  costEstimate: number | null;
  actualCost: number | null;
  currency: string;
  resolutionNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type QuoteResponse = {
  uid: string;
  workOrderId: string;
  vendorId: string;
  amount: number;
  currency: string;
  notes: string | null;
  status: string;
  proposedByUserId: string;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EventResponse = {
  uid: string;
  workOrderId: string;
  actorUserId: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  message: string | null;
  createdAt: Date;
};

export function toVendorResponse(v: Vendor): VendorResponse {
  return {
    uid: v.uid,
    displayName: v.displayName,
    companyName: v.companyName,
    contactPhone: v.contactPhone,
    contactEmail: v.contactEmail,
    categories: v.categories,
    status: v.status,
    gstNumber: v.gstNumber,
    panNumber: v.panNumber,
    address: v.address,
    city: v.city,
    notes: v.notes,
    userId: v.userId,
    createdByUserId: v.createdByUserId,
    reviewedByUserId: v.reviewedByUserId,
    reviewedAt: v.reviewedAt,
    rejectionReason: v.rejectionReason,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

export function toDocResponse(d: VendorDocument): VendorDocumentResponse {
  return {
    uid: d.uid,
    vendorId: d.vendorId,
    docType: d.docType,
    label: d.label,
    referenceOrUrl: d.referenceOrUrl,
    status: d.status,
    notes: d.notes,
    verifiedByUserId: d.verifiedByUserId,
    verifiedAt: d.verifiedAt,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  };
}

export function toSocietyAssignResponse(
  a: VendorSociety,
): VendorSocietyResponse {
  return {
    uid: a.uid,
    vendorId: a.vendorId,
    societyId: a.societyId,
    status: a.status,
    notes: a.notes,
    approvedByUserId: a.approvedByUserId,
    approvedAt: a.approvedAt,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  };
}

export function toWorkOrderResponse(w: WorkOrder): WorkOrderResponse {
  return {
    uid: w.uid,
    societyId: w.societyId,
    flatId: w.flatId,
    buildingId: w.buildingId,
    title: w.title,
    description: w.description,
    category: w.category,
    priority: w.priority,
    status: w.status,
    requestedByUserId: w.requestedByUserId,
    assignedVendorId: w.assignedVendorId,
    complaintId: w.complaintId,
    scheduledStartAt: w.scheduledStartAt,
    scheduledEndAt: w.scheduledEndAt,
    completedAt: w.completedAt,
    verifiedAt: w.verifiedAt,
    verifiedByUserId: w.verifiedByUserId,
    costEstimate: w.costEstimate == null ? null : Number(w.costEstimate),
    actualCost: w.actualCost == null ? null : Number(w.actualCost),
    currency: w.currency,
    resolutionNotes: w.resolutionNotes,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
  };
}

export function toQuoteResponse(q: WorkOrderQuote): QuoteResponse {
  return {
    uid: q.uid,
    workOrderId: q.workOrderId,
    vendorId: q.vendorId,
    amount: Number(q.amount),
    currency: q.currency,
    notes: q.notes,
    status: q.status,
    proposedByUserId: q.proposedByUserId,
    decidedAt: q.decidedAt,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  };
}

export function toEventResponse(e: WorkOrderEvent): EventResponse {
  return {
    uid: e.uid,
    workOrderId: e.workOrderId,
    actorUserId: e.actorUserId,
    eventType: e.eventType,
    fromStatus: e.fromStatus,
    toStatus: e.toStatus,
    message: e.message,
    createdAt: e.createdAt,
  };
}
