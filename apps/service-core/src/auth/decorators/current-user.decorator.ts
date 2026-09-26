import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../auth-user.type.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser | undefined => {
    const type = ctx.getType<'http' | 'rpc'>();
    if (type === 'http') {
      return ctx.switchToHttp().getRequest().user as AuthUser;
    }
    return ctx.switchToRpc().getContext().user as AuthUser | undefined;
  },
);
