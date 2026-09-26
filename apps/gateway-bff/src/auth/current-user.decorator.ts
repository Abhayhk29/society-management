import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GatewayAuthUser } from './auth-user.type.js';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): GatewayAuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user: GatewayAuthUser }>();
    return request.user;
  },
);
