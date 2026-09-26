import { assertSocietyAccess } from '../core/core-client';
import {
  buildQrPayload,
  hashQrPayload,
  mintQrPayload,
  parseQrPayload,
  verifyQrSignature,
} from './qr';
import {
  findGatePassById,
  insertGatePass,
  listGatePasses,
  updateGatePassFields,
} from './repository';
import type { GatePassRow, GatePassStatus, GatePassView } from './types';

export type Actor = {
  userId: string;
  permissions: string[];
  accessToken?: string;
};

function hasPerm(actor: Actor, permission: string) {
  return actor.permissions.includes(permission);
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

export function toView(
  row: GatePassRow,
  qrPayload: string | null = null,
): GatePassView {
  return {
    uid: row.uid,
    societyId: row.society_id,
    flatId: row.flat_id,
    visitorName: row.visitor_name,
    visitorPhone: row.visitor_phone,
    purpose: row.purpose,
    createdByUserId: row.created_by_user_id,
    approvedByUserId: row.approved_by_user_id,
    status: row.status,
    validFrom: toIso(row.valid_from)!,
    validUntil: toIso(row.valid_until)!,
    qrPayload,
    usedAt: toIso(row.used_at),
    rejectedReason: row.rejected_reason,
    createdAt: toIso(row.created_at)!,
    updatedAt: toIso(row.updated_at)!,
  };
}

function fail(code: number, message: string): never {
  throw Object.assign(new Error(message), { code });
}

async function maybeExpire(row: GatePassRow): Promise<GatePassRow> {
  if (
    (row.status === 'APPROVED' || row.status === 'PENDING') &&
    new Date(row.valid_until).getTime() < Date.now()
  ) {
    const updated = await updateGatePassFields(row.uid, { status: 'EXPIRED' });
    return updated ?? { ...row, status: 'EXPIRED' };
  }
  return row;
}

export async function createGatePass(
  input: {
    societyId: string;
    flatId?: string;
    visitorName: string;
    visitorPhone?: string;
    purpose?: string;
    validFrom?: string;
    validUntil?: string;
  },
  actor: Actor,
): Promise<GatePassView> {
  if (!hasPerm(actor, 'create:gate_pass')) {
    fail(7, 'Missing permission create:gate_pass');
  }
  if (!input.visitorName?.trim()) {
    fail(3, 'visitorName is required');
  }

  await assertSocietyAccess({
    userId: actor.userId,
    societyId: input.societyId,
    accessToken: actor.accessToken,
  });

  const validFrom = input.validFrom
    ? new Date(input.validFrom)
    : new Date();
  const validUntil = input.validUntil
    ? new Date(input.validUntil)
    : new Date(Date.now() + 24 * 60 * 60 * 1000);

  if (!(validUntil > validFrom)) {
    fail(3, 'validUntil must be after validFrom');
  }

  const autoApprove = hasPerm(actor, 'approve:gate_pass');
  let status: GatePassStatus = autoApprove ? 'APPROVED' : 'PENDING';
  let qrTokenHash: string | null = null;
  let qrNonce: string | null = null;
  let qrPayload: string | null = null;
  let approvedBy: string | null = null;

  // Insert first to get uid, then mint QR for approved passes
  const row = await insertGatePass({
    societyId: input.societyId,
    flatId: input.flatId || null,
    visitorName: input.visitorName.trim(),
    visitorPhone: input.visitorPhone?.trim() || null,
    purpose: input.purpose?.trim() || null,
    createdByUserId: actor.userId,
    approvedByUserId: null,
    status: 'PENDING',
    validFrom,
    validUntil,
    qrTokenHash: null,
    qrNonce: null,
  });

  if (autoApprove) {
    const minted = mintQrPayload(row.uid, validUntil);
    const updated = await updateGatePassFields(row.uid, {
      status: 'APPROVED',
      approvedByUserId: actor.userId,
      qrTokenHash: minted.tokenHash,
      qrNonce: minted.nonce,
    });
    status = 'APPROVED';
    qrPayload = minted.payload;
    qrTokenHash = minted.tokenHash;
    qrNonce = minted.nonce;
    approvedBy = actor.userId;
    return toView(updated ?? { ...row, status, approved_by_user_id: approvedBy, qr_token_hash: qrTokenHash, qr_nonce: qrNonce }, qrPayload);
  }

  return toView(row, null);
}

export async function getGatePass(
  uid: string,
  actor: Actor,
): Promise<GatePassView> {
  if (!hasPerm(actor, 'view:gate_pass')) {
    fail(7, 'Missing permission view:gate_pass');
  }
  let row = await findGatePassById(uid);
  if (!row) fail(5, 'Gate pass not found');
  row = await maybeExpire(row);

  let qrPayload: string | null = null;
  if (
    row.status === 'APPROVED' &&
    row.qr_nonce &&
    (row.created_by_user_id === actor.userId ||
      hasPerm(actor, 'approve:gate_pass'))
  ) {
    const built = buildQrPayload(
      row.uid,
      new Date(row.valid_until),
      row.qr_nonce,
    );
    if (built.tokenHash === row.qr_token_hash) {
      qrPayload = built.payload;
    }
  }

  return toView(row, qrPayload);
}

export async function listPasses(
  societyId: string,
  actor: Actor,
  status?: string,
): Promise<GatePassView[]> {
  if (!hasPerm(actor, 'view:gate_pass')) {
    fail(7, 'Missing permission view:gate_pass');
  }
  await assertSocietyAccess({
    userId: actor.userId,
    societyId,
    accessToken: actor.accessToken,
  });
  const rows = await listGatePasses({ societyId, status });
  const views: GatePassView[] = [];
  for (const row of rows) {
    const current = await maybeExpire(row);
    views.push(toView(current, null));
  }
  return views;
}

export async function approveGatePass(
  uid: string,
  actor: Actor,
): Promise<GatePassView> {
  if (!hasPerm(actor, 'approve:gate_pass')) {
    fail(7, 'Missing permission approve:gate_pass');
  }
  let row = await findGatePassById(uid);
  if (!row) fail(5, 'Gate pass not found');
  row = await maybeExpire(row);
  if (row.status !== 'PENDING') {
    fail(9, `Cannot approve pass in status ${row.status}`);
  }

  const minted = mintQrPayload(row.uid, new Date(row.valid_until));
  const updated = await updateGatePassFields(row.uid, {
    status: 'APPROVED',
    approvedByUserId: actor.userId,
    qrTokenHash: minted.tokenHash,
    qrNonce: minted.nonce,
  });
  if (!updated) fail(13, 'Failed to approve gate pass');
  return toView(updated, minted.payload);
}

export async function rejectGatePass(
  uid: string,
  reason: string | undefined,
  actor: Actor,
): Promise<GatePassView> {
  if (!hasPerm(actor, 'approve:gate_pass')) {
    fail(7, 'Missing permission approve:gate_pass');
  }
  let row = await findGatePassById(uid);
  if (!row) fail(5, 'Gate pass not found');
  row = await maybeExpire(row);
  if (row.status !== 'PENDING') {
    fail(9, `Cannot reject pass in status ${row.status}`);
  }
  const updated = await updateGatePassFields(row.uid, {
    status: 'REJECTED',
    approvedByUserId: actor.userId,
    rejectedReason: reason?.trim() || 'Rejected',
  });
  if (!updated) fail(13, 'Failed to reject gate pass');
  return toView(updated, null);
}

export async function cancelGatePass(
  uid: string,
  actor: Actor,
): Promise<GatePassView> {
  let row = await findGatePassById(uid);
  if (!row) fail(5, 'Gate pass not found');
  row = await maybeExpire(row);

  const canCancel =
    row.created_by_user_id === actor.userId ||
    hasPerm(actor, 'approve:gate_pass');
  if (!canCancel) {
    fail(7, 'Not allowed to cancel this gate pass');
  }
  if (row.status === 'USED' || row.status === 'CANCELLED') {
    fail(9, `Cannot cancel pass in status ${row.status}`);
  }

  const updated = await updateGatePassFields(row.uid, {
    status: 'CANCELLED',
  });
  if (!updated) fail(13, 'Failed to cancel gate pass');
  return toView(updated, null);
}

export async function verifyQr(
  qrPayload: string,
  actor: Actor,
): Promise<{ valid: boolean; message: string; gatePass?: GatePassView }> {
  if (!hasPerm(actor, 'approve:gate_pass') && !hasPerm(actor, 'view:gate_pass')) {
    fail(7, 'Missing permission to verify QR');
  }

  const parsed = parseQrPayload(qrPayload);
  if (!parsed) {
    return { valid: false, message: 'Invalid QR payload' };
  }
  if (parsed.exp * 1000 < Date.now()) {
    return { valid: false, message: 'QR code expired' };
  }

  let row = await findGatePassById(parsed.passId);
  if (!row) {
    return { valid: false, message: 'Gate pass not found' };
  }
  row = await maybeExpire(row);

  if (row.status !== 'APPROVED') {
    return { valid: false, message: `Pass is ${row.status}` };
  }
  if (!row.qr_nonce || !row.qr_token_hash) {
    return { valid: false, message: 'Pass has no QR token' };
  }
  if (!verifyQrSignature(row.uid, parsed.exp, row.qr_nonce, parsed.sig)) {
    return { valid: false, message: 'Invalid QR signature' };
  }
  if (hashQrPayload(parsed.payload) !== row.qr_token_hash) {
    return { valid: false, message: 'QR token mismatch' };
  }

  const updated = await updateGatePassFields(row.uid, {
    status: 'USED',
    usedAt: new Date(),
  });
  if (!updated) {
    return { valid: false, message: 'Failed to mark pass as used' };
  }

  return {
    valid: true,
    message: 'Entry granted',
    gatePass: toView(updated, null),
  };
}
