import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthVerificationService } from './auth-verification.service.js';
import { GatewayAuthUser } from './auth-user.type.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authVerification: AuthVerificationService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: GatewayAuthUser;
    }>();
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing authentication token');
    }
    const token = header.slice(7).trim();
    request.user = await this.authVerification.verify(token);
    return true;
  }
}
