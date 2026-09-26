import { Complaint } from './entities/complaint.entity.js';
import { Notice } from './entities/notice.entity.js';
import { Visitor } from './entities/visitor.entity.js';

export function toNotice(n: Notice) {
  return {
    uid: n.uid,
    societyId: n.societyId,
    title: n.title,
    body: n.body,
    priority: n.priority,
    publishedAt: n.publishedAt,
    expiresAt: n.expiresAt,
    createdByUserId: n.createdByUserId,
    isActive: n.isActive,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

export function toComplaint(c: Complaint) {
  return {
    uid: c.uid,
    societyId: c.societyId,
    flatId: c.flatId,
    raisedByUserId: c.raisedByUserId,
    category: c.category,
    title: c.title,
    description: c.description,
    status: c.status,
    assignedToUserId: c.assignedToUserId,
    resolutionNotes: c.resolutionNotes,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

export function toVisitor(v: Visitor) {
  return {
    uid: v.uid,
    societyId: v.societyId,
    flatId: v.flatId,
    hostUserId: v.hostUserId,
    visitorName: v.visitorName,
    visitorPhone: v.visitorPhone,
    purpose: v.purpose,
    expectedAt: v.expectedAt,
    status: v.status,
    checkedInAt: v.checkedInAt,
    checkedOutAt: v.checkedOutAt,
    gatePassId: v.gatePassId,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}
