import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { AUTH_SERVICE } from 'shared-protos';
import { CORE_GRPC } from '../grpc/grpc-clients.module.js';
import { mapGrpcError } from '../grpc/grpc-error.util.js';
import { GatewayAuthUser } from './auth-user.type.js';

type MeResponse = {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  roles?: Array<{ uid: string; name: string; description?: string }>;
  permissions?: string[];
};

interface AuthServiceClient {
  me(data: { accessToken: string }): Observable<MeResponse>;
}

@Injectable()
export class AuthVerificationService implements OnModuleInit {
  private auth!: AuthServiceClient;

  constructor(@Inject(CORE_GRPC) private readonly coreClient: ClientGrpc) {}

  onModuleInit() {
    this.auth = this.coreClient.getService<AuthServiceClient>(AUTH_SERVICE);
  }

  async verify(accessToken: string): Promise<GatewayAuthUser> {
    try {
      const user = await firstValueFrom(this.auth.me({ accessToken }));
      return {
        uid: user.uid,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive,
        roles: user.roles,
        permissions: user.permissions ?? [],
      };
    } catch (error) {
      mapGrpcError(error);
    }
  }
}
