import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import { AuthService } from '../../auth/auth.service.js';
import type { AuthUser } from '../../auth/auth-user.type.js';

/**
 * Allows either a valid user JWT or INTERNAL_SERVICE_KEY
 * (for realtime / analytics → core enqueue).
 */
@Injectable()
export class ServiceOrJwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const serviceKey = this.extractServiceKey(context);
    const expected =
      process.env.INTERNAL_SERVICE_KEY ?? 'dev-internal-service-key';

    if (serviceKey && serviceKey === expected) {
      const systemUser: AuthUser = {
        uid: '00000000-0000-4000-8000-000000000001',
        email: 'system@nivas.internal',
        firstName: 'System',
        lastName: 'Service',
        isActive: true,
        roles: [],
        permissions: ['enqueue:notification', 'view:notification'],
      };
      this.attachUser(context, systemUser);
      return true;
    }

    const token = this.extractBearer(context);
    if (!token) {
      throw new UnauthorizedException(
        'Missing authentication token or service key',
      );
    }
    const user = await this.authService.resolveAuthUser(token);
    this.attachUser(context, user);
    return true;
  }

  private attachUser(context: ExecutionContext, user: AuthUser) {
    if (context.getType() === 'http') {
      context.switchToHttp().getRequest().user = user;
    } else {
      const rpcContext = context.switchToRpc().getContext();
      rpcContext.user = user;
    }
  }

  private extractServiceKey(context: ExecutionContext): string | null {
    if (context.getType() === 'http') {
      const header = context.switchToHttp().getRequest().headers?.[
        'x-service-key'
      ];
      return header ? String(header) : null;
    }
    const metadata = context.switchToRpc().getContext();
    const values =
      metadata?.get?.('x-service-key') ??
      metadata?.get?.('X-Service-Key') ??
      [];
    const raw = Array.isArray(values)
      ? String(values[0] ?? '')
      : String(values);
    return raw.trim() || null;
  }

  private extractBearer(context: ExecutionContext): string | null {
    if (context.getType() === 'http') {
      const header = context.switchToHttp().getRequest().headers
        ?.authorization as string | undefined;
      return this.fromBearer(header);
    }
    const metadata = context.switchToRpc().getContext();
    const values =
      metadata?.get?.('authorization') ??
      metadata?.get?.('Authorization') ??
      [];
    const raw = Array.isArray(values)
      ? String(values[0] ?? '')
      : String(values);
    return this.fromBearer(raw);
  }

  private fromBearer(value?: string): string | null {
    if (!value) return null;
    if (value.startsWith('Bearer ')) return value.slice(7).trim();
    return value.trim() || null;
  }
}
