import { createHash, randomBytes, randomInt } from 'crypto';

export function hashSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

export function generateOtpCode(digits = 6): string {
  const max = 10 ** digits;
  const num = randomInt(0, max);
  return String(num).padStart(digits, '0');
}
