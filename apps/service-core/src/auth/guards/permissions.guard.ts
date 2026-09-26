import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from '../auth-user.type.js';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) {
      return true;
    }

    const user = this.getUser(context);
    if (!user) {
      throw new ForbiddenException('Authenticated user required');
    }

    const hasAll = required.every((permission) =>
      user.permissions.includes(permission),
    );
    if (!hasAll) {
      throw new ForbiddenException(
        `Missing required permission(s): ${required.join(', ')}`,
      );
    }
    return true;
  }

  private getUser(context: ExecutionContext): AuthUser | undefined {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest().user as AuthUser | undefined;
    }
    return (context.switchToRpc().getContext() as { user?: AuthUser }).user;
  }
}
