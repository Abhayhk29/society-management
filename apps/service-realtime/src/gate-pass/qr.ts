import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { config } from '../config';

export type QrParts = {
  passId: string;
  exp: number;
  sig: string;
  payload: string;
};

function sign(passId: string, exp: number, nonce: string): string {
  return createHmac('sha256', config.qrSecret)
    .update(`${passId}.${exp}.${nonce}`)
    .digest('hex')
    .slice(0, 32);
}

export function buildQrPayload(
  passId: string,
  validUntil: Date,
  nonce: string,
): { payload: string; tokenHash: string; nonce: string; exp: number } {
  const exp = Math.floor(validUntil.getTime() / 1000);
  const sig = sign(passId, exp, nonce);
  const payload = `gp.${passId}.${exp}.${sig}`;
  const tokenHash = createHmac('sha256', config.qrSecret)
    .update(payload)
    .digest('hex');
  return { payload, tokenHash, nonce, exp };
}

export function mintQrPayload(
  passId: string,
  validUntil: Date,
  nonce = randomBytes(16).toString('hex'),
): { payload: string; tokenHash: string; nonce: string } {
  const built = buildQrPayload(passId, validUntil, nonce);
  return {
    payload: built.payload,
    tokenHash: built.tokenHash,
    nonce: built.nonce,
  };
}

export function parseQrPayload(payload: string): QrParts | null {
  const parts = payload.trim().split('.');
  if (parts.length !== 4 || parts[0] !== 'gp') {
    return null;
  }
  const [, passId, expRaw, sig] = parts;
  const exp = Number(expRaw);
  if (!passId || !sig || !Number.isFinite(exp)) {
    return null;
  }
  return { passId, exp, sig, payload: payload.trim() };
}

export function verifyQrSignature(
  passId: string,
  exp: number,
  nonce: string,
  sig: string,
): boolean {
  const expected = sign(passId, exp, nonce);
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

export function hashQrPayload(payload: string): string {
  return createHmac('sha256', config.qrSecret).update(payload).digest('hex');
}
