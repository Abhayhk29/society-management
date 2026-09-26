type Level = 'info' | 'warn' | 'error' | 'debug';

function shouldJson(): boolean {
  const format = (process.env.LOG_FORMAT ?? '').trim().toLowerCase();
  if (format === 'pretty' || format === 'text') {
    return false;
  }
  if (format === 'json') {
    return true;
  }
  return process.env.NODE_ENV === 'production';
}

export function log(
  level: Level,
  message: string,
  fields?: Record<string, unknown>,
): void {
  if (shouldJson()) {
    const line = JSON.stringify({
      level,
      message,
      service: 'service-realtime',
      timestamp: new Date().toISOString(),
      ...fields,
    });
    if (level === 'error') {
      process.stderr.write(`${line}\n`);
    } else {
      process.stdout.write(`${line}\n`);
    }
    return;
  }
  const suffix = fields ? ` ${JSON.stringify(fields)}` : '';
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](`[${level}] ${message}${suffix}`);
}
