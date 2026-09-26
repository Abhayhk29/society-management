import type { LoggerService, LogLevel } from '@nestjs/common';
import { ConsoleLogger } from '@nestjs/common';
import { isProductionEnv } from './http-security.js';

type LogRecord = {
  level: string;
  message: string;
  context?: string;
  timestamp: string;
  service?: string;
  stack?: string;
};

function shouldJson(): boolean {
  const format = (process.env.LOG_FORMAT ?? '').trim().toLowerCase();
  if (format === 'pretty' || format === 'text') {
    return false;
  }
  if (format === 'json') {
    return true;
  }
  return isProductionEnv();
}

function asMessage(message: unknown): string {
  if (typeof message === 'string') {
    return message;
  }
  try {
    return JSON.stringify(message);
  } catch {
    return String(message);
  }
}

/**
 * Nest logger: JSON lines when LOG_FORMAT=json or NODE_ENV=production
 * (unless LOG_FORMAT=pretty|text); otherwise delegates to ConsoleLogger.
 */
export class JsonLogger implements LoggerService {
  private readonly pretty = new ConsoleLogger();
  private readonly serviceName: string;

  constructor(serviceName?: string) {
    this.serviceName =
      serviceName?.trim() ||
      process.env.SERVICE_NAME?.trim() ||
      process.env.npm_package_name ||
      'app';
    if (serviceName) {
      process.env.SERVICE_NAME = serviceName;
    }
  }

  private write(level: LogLevel | 'verbose' | 'fatal', message: unknown, context?: string, stack?: string) {
    if (!shouldJson()) {
      return false;
    }
    const record: LogRecord = {
      level,
      message: asMessage(message),
      timestamp: new Date().toISOString(),
      service: this.serviceName,
    };
    if (context) {
      record.context = context;
    }
    if (stack) {
      record.stack = stack;
    }
    const line = `${JSON.stringify(record)}\n`;
    if (level === 'error' || level === 'fatal') {
      process.stderr.write(line);
    } else {
      process.stdout.write(line);
    }
    return true;
  }

  log(message: any, context?: string): void {
    if (!this.write('log', message, context)) {
      this.pretty.log(message, context);
    }
  }

  error(message: any, stackOrContext?: string, context?: string): void {
    const hasStack =
      typeof stackOrContext === 'string' &&
      (stackOrContext.includes('\n') || /Error:/.test(stackOrContext));
    const stack = hasStack ? stackOrContext : undefined;
    const ctx = hasStack ? context : stackOrContext || context;
    if (!this.write('error', message, ctx, stack)) {
      this.pretty.error(message, stackOrContext, context);
    }
  }

  warn(message: any, context?: string): void {
    if (!this.write('warn', message, context)) {
      this.pretty.warn(message, context);
    }
  }

  debug?(message: any, context?: string): void {
    if (!this.write('debug', message, context)) {
      this.pretty.debug?.(message, context);
    }
  }

  verbose?(message: any, context?: string): void {
    if (!this.write('verbose', message, context)) {
      this.pretty.verbose?.(message, context);
    }
  }

  fatal?(message: any, context?: string): void {
    if (!this.write('fatal', message, context)) {
      this.pretty.fatal?.(message, context);
    }
  }

  setLogLevels?(levels: LogLevel[]): void {
    this.pretty.setLogLevels?.(levels);
  }
}

export function createAppLogger(serviceName?: string): JsonLogger {
  return new JsonLogger(serviceName);
}
