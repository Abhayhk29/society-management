import { randomUUID } from 'crypto';
import { pool } from '../db/pool';
import type { GatePassRow, GatePassStatus } from './types';

export async function insertGatePass(input: {
  societyId: string;
  flatId: string | null;
  visitorName: string;
  visitorPhone: string | null;
  purpose: string | null;
  createdByUserId: string;
  approvedByUserId: string | null;
  status: GatePassStatus;
  validFrom: Date;
  validUntil: Date;
  qrTokenHash: string | null;
  qrNonce: string | null;
}): Promise<GatePassRow> {
  const uid = randomUUID();
  const result = await pool.query<GatePassRow>(
    `INSERT INTO gate_passes (
      uid, society_id, flat_id, visitor_name, visitor_phone, purpose,
      created_by_user_id, approved_by_user_id, status,
      valid_from, valid_until, qr_token_hash, qr_nonce
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    RETURNING *`,
    [
      uid,
      input.societyId,
      input.flatId,
      input.visitorName,
      input.visitorPhone,
      input.purpose,
      input.createdByUserId,
      input.approvedByUserId,
      input.status,
      input.validFrom,
      input.validUntil,
      input.qrTokenHash,
      input.qrNonce,
    ],
  );
  return result.rows[0];
}

export async function findGatePassById(uid: string): Promise<GatePassRow | null> {
  const result = await pool.query<GatePassRow>(
    `SELECT * FROM gate_passes WHERE uid = $1`,
    [uid],
  );
  return result.rows[0] ?? null;
}

export async function listGatePasses(input: {
  societyId: string;
  status?: string;
}): Promise<GatePassRow[]> {
  if (input.status) {
    const result = await pool.query<GatePassRow>(
      `SELECT * FROM gate_passes
       WHERE society_id = $1 AND status = $2
       ORDER BY created_at DESC
       LIMIT 200`,
      [input.societyId, input.status],
    );
    return result.rows;
  }
  const result = await pool.query<GatePassRow>(
    `SELECT * FROM gate_passes
     WHERE society_id = $1
     ORDER BY created_at DESC
     LIMIT 200`,
    [input.societyId],
  );
  return result.rows;
}

export async function updateGatePassFields(
  uid: string,
  fields: {
    status?: GatePassStatus;
    approvedByUserId?: string | null;
    qrTokenHash?: string | null;
    qrNonce?: string | null;
    usedAt?: Date | null;
    rejectedReason?: string | null;
  },
): Promise<GatePassRow | null> {
  const sets: string[] = ['updated_at = NOW()'];
  const values: unknown[] = [uid];
  let idx = 2;

  if (fields.status !== undefined) {
    sets.push(`status = $${idx++}`);
    values.push(fields.status);
  }
  if (fields.approvedByUserId !== undefined) {
    sets.push(`approved_by_user_id = $${idx++}`);
    values.push(fields.approvedByUserId);
  }
  if (fields.qrTokenHash !== undefined) {
    sets.push(`qr_token_hash = $${idx++}`);
    values.push(fields.qrTokenHash);
  }
  if (fields.qrNonce !== undefined) {
    sets.push(`qr_nonce = $${idx++}`);
    values.push(fields.qrNonce);
  }
  if (fields.usedAt !== undefined) {
    sets.push(`used_at = $${idx++}`);
    values.push(fields.usedAt);
  }
  if (fields.rejectedReason !== undefined) {
    sets.push(`rejected_reason = $${idx++}`);
    values.push(fields.rejectedReason);
  }

  const result = await pool.query<GatePassRow>(
    `UPDATE gate_passes SET ${sets.join(', ')} WHERE uid = $1 RETURNING *`,
    values,
  );
  return result.rows[0] ?? null;
}
