import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GatewayAuthUser } from './auth-user.type.js';
import { PERMISSIONS_KEY } from './require-permissions.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<{
      user?: GatewayAuthUser;
    }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Authenticated user required');
    }

    const ok = required.every((p) => user.permissions.includes(p));
    if (!ok) {
      throw new ForbiddenException(
        `Missing required permission(s): ${required.join(', ')}`,
      );
    }
    return true;
  }
}
