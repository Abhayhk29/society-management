export type GatePassStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'USED'
  | 'EXPIRED'
  | 'CANCELLED';

export type GatePassRow = {
  uid: string;
  society_id: string;
  flat_id: string | null;
  visitor_name: string;
  visitor_phone: string | null;
  purpose: string | null;
  created_by_user_id: string;
  approved_by_user_id: string | null;
  status: GatePassStatus;
  valid_from: Date;
  valid_until: Date;
  qr_token_hash: string | null;
  qr_nonce: string | null;
  used_at: Date | null;
  rejected_reason: string | null;
  created_at: Date;
  updated_at: Date;
};

export type GatePassView = {
  uid: string;
  societyId: string;
  flatId: string | null;
  visitorName: string;
  visitorPhone: string | null;
  purpose: string | null;
  createdByUserId: string;
  approvedByUserId: string | null;
  status: GatePassStatus;
  validFrom: string;
  validUntil: string;
  qrPayload: string | null;
  usedAt: string | null;
  rejectedReason: string | null;
  createdAt: string;
  updatedAt: string;
};
