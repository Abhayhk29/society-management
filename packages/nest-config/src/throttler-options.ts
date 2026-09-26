import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { isProductionEnv } from './http-security.js';

export type ThrottlerRootOptions = {
  throttlers: Array<{ name: string; ttl: number; limit: number }>;
  storage?: ThrottlerStorageRedisService;
};

const logger = new Logger('ThrottlerConfig');

/**
 * Build `@nestjs/throttler` root options.
 *
 * Storage selection:
 * - `THROTTLE_STORAGE=redis` → Redis (requires `REDIS_URL` or `THROTTLE_REDIS_URL`)
 * - `THROTTLE_STORAGE=memory` → in-memory
 * - unset → Redis when `REDIS_URL` is set and `NODE_ENV=production`, else memory
 *
 * Keys are prefixed per service (`nivas:throttle:<service>:`) so gateway and
 * core can share one Redis without colliding.
 */
export function createThrottlerRootOptions(
  config: ConfigService,
  options?: { serviceKey?: string },
): ThrottlerRootOptions {
  const throttlers = [
    {
      name: 'default',
      ttl: Number(config.get('THROTTLE_TTL_MS', 60_000)),
      limit: Number(config.get('THROTTLE_LIMIT', 100)),
    },
  ];

  const redisUrl = (
    config.get<string>('REDIS_URL') ??
    config.get<string>('THROTTLE_REDIS_URL') ??
    ''
  ).trim();

  const explicit = (config.get<string>('THROTTLE_STORAGE') ?? '')
    .trim()
    .toLowerCase();

  const useRedis =
    explicit === 'redis' ||
    (explicit === '' && Boolean(redisUrl) && isProductionEnv());

  if (!useRedis) {
    logger.log('Throttler storage: in-memory');
    return { throttlers };
  }

  if (!redisUrl) {
    throw new Error(
      'THROTTLE_STORAGE=redis requires REDIS_URL (or THROTTLE_REDIS_URL)',
    );
  }

  const serviceKey = (
    options?.serviceKey ??
    config.get<string>('SERVICE_NAME') ??
    'app'
  )
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .toLowerCase();

  const configuredPrefix = config.get<string>('THROTTLE_REDIS_PREFIX')?.trim();
  const keyPrefix = configuredPrefix
    ? configuredPrefix.endsWith(':')
      ? configuredPrefix
      : `${configuredPrefix}:`
    : `nivas:throttle:${serviceKey}:`;

  const client = new Redis(redisUrl, {
    keyPrefix,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });

  client.on('error', (err: Error) => {
    logger.error(`Redis throttler client error: ${err.message}`);
  });

  logger.log(`Throttler storage: redis (${keyPrefix})`);

  return {
    throttlers,
    storage: new ThrottlerStorageRedisService(client),
  };
}
