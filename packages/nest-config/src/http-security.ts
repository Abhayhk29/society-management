/**
 * Shared HTTP security helpers (CORS allowlists, env checks).
 * Helmet stays in each app's bootstrap. Throttler module wiring lives
 * in each app; Redis storage options are built via `createThrottlerRootOptions`.
 */

export function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Comma-separated CORS_ORIGINS plus optional FRONTEND_ORIGIN. */
export function resolveCorsOrigins(options?: {
  /** When true (default), use localhost:3000 in non-production if unset. */
  allowDevDefaults?: boolean;
  /** When true, throw if production has no origins. */
  requireInProduction?: boolean;
}): string[] {
  const allowDevDefaults = options?.allowDevDefaults !== false;
  const requireInProduction = options?.requireInProduction === true;

  const fromList = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const frontend = process.env.FRONTEND_ORIGIN?.trim();
  const origins = [
    ...new Set([...fromList, ...(frontend ? [frontend] : [])]),
  ];

  if (origins.length > 0) {
    return origins;
  }

  if (isProductionEnv()) {
    if (requireInProduction) {
      throw new Error(
        'CORS_ORIGINS or FRONTEND_ORIGIN must be set when NODE_ENV=production',
      );
    }
    return [];
  }

  if (!allowDevDefaults) {
    return [];
  }

  return ['http://localhost:3000', 'http://127.0.0.1:3000'];
}

export function resolveTrustProxy(): boolean | number {
  const raw = process.env.TRUST_PROXY?.trim();
  if (!raw) {
    return false;
  }
  if (raw === 'true' || raw === '1') {
    return true;
  }
  if (raw === 'false' || raw === '0') {
    return false;
  }
  const hops = Number(raw);
  return Number.isFinite(hops) && hops > 0 ? hops : false;
}
