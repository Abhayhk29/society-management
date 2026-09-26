import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import { AuthService } from '../auth.service.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const token = this.extractToken(context);
    if (!token) {
      throw new UnauthorizedException('Missing authentication token');
    }

    const user = await this.authService.resolveAuthUser(token);

    if (context.getType() === 'http') {
      context.switchToHttp().getRequest().user = user;
    } else {
      const rpcContext = context.switchToRpc().getContext() as Metadata & {
        user?: unknown;
      };
      rpcContext.user = user;
    }

    return true;
  }

  private extractToken(context: ExecutionContext): string | null {
    if (context.getType() === 'http') {
      const header = context.switchToHttp().getRequest()
        .headers?.authorization as string | undefined;
      return this.fromBearer(header);
    }

    const metadata = context.switchToRpc().getContext() as Metadata;
    const values =
      metadata?.get?.('authorization') ??
      metadata?.get?.('Authorization') ??
      [];
    const raw = Array.isArray(values) ? String(values[0] ?? '') : String(values);
    return this.fromBearer(raw);
  }

  private fromBearer(value?: string): string | null {
    if (!value) return null;
    if (value.startsWith('Bearer ')) return value.slice(7).trim();
    return value.trim() || null;
  }
}
