import { Metadata } from '@grpc/grpc-js';
import { Inject, Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Request } from 'express';
import { firstValueFrom, Observable } from 'rxjs';
import { GATE_PASS_SERVICE } from 'shared-protos';
import { GatewayAuthUser } from '../auth/auth-user.type.js';
import { REALTIME_GRPC } from '../grpc/grpc-clients.module.js';
import { mapGrpcError } from '../grpc/grpc-error.util.js';

type GrpcUnary<TReq, TRes> = (
  data: TReq,
  metadata?: Metadata,
) => Observable<TRes>;

interface GatePassServiceClient {
  createGatePass: GrpcUnary<unknown, unknown>;
  getGatePass: GrpcUnary<unknown, unknown>;
  listGatePasses: GrpcUnary<unknown, { gatePasses: unknown[] }>;
  approveGatePass: GrpcUnary<unknown, unknown>;
  rejectGatePass: GrpcUnary<unknown, unknown>;
  cancelGatePass: GrpcUnary<unknown, unknown>;
  verifyQr: GrpcUnary<unknown, unknown>;
}

@Injectable({ scope: Scope.REQUEST })
export class GatePassService implements OnModuleInit {
  private client!: GatePassServiceClient;

  constructor(
    @Inject(REALTIME_GRPC) private readonly realtime: ClientGrpc,
    @Inject(REQUEST)
    private readonly request: Request & { user?: GatewayAuthUser },
  ) {}

  onModuleInit() {
    this.client =
      this.realtime.getService<GatePassServiceClient>(GATE_PASS_SERVICE);
  }

  private metadata(): Metadata {
    const metadata = new Metadata();
    const header = this.request.headers?.authorization;
    if (header) {
      metadata.set('authorization', String(header));
    }
    return metadata;
  }

  private actor() {
    const user = this.request.user;
    return {
      actorUserId: user?.uid ?? '',
      actorPermissions: user?.permissions ?? [],
    };
  }

  private async call<T>(fn: (metadata: Metadata) => Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(fn(this.metadata()));
    } catch (error) {
      mapGrpcError(error);
    }
  }

  create(body: Record<string, unknown>) {
    return this.call((metadata) =>
      this.client.createGatePass(
        {
          ...this.actor(),
          societyId: body.societyId,
          flatId: body.flatId ?? '',
          hasFlatId: body.flatId !== undefined && body.flatId !== null,
          visitorName: body.visitorName,
          visitorPhone: body.visitorPhone ?? '',
          purpose: body.purpose ?? '',
          validFrom: body.validFrom ?? '',
          validUntil: body.validUntil ?? '',
        },
        metadata,
      ),
    );
  }

  get(uid: string) {
    return this.call((metadata) =>
      this.client.getGatePass({ uid, ...this.actor() }, metadata),
    );
  }

  async list(societyId: string, status?: string) {
    const res = await this.call((metadata) =>
      this.client.listGatePasses(
        {
          societyId,
          status: status ?? '',
          hasStatus: Boolean(status),
          ...this.actor(),
        },
        metadata,
      ),
    );
    return res.gatePasses ?? [];
  }

  approve(uid: string) {
    return this.call((metadata) =>
      this.client.approveGatePass({ uid, ...this.actor() }, metadata),
    );
  }

  reject(uid: string, reason?: string) {
    return this.call((metadata) =>
      this.client.rejectGatePass(
        { uid, reason: reason ?? '', ...this.actor() },
        metadata,
      ),
    );
  }

  cancel(uid: string) {
    return this.call((metadata) =>
      this.client.cancelGatePass({ uid, ...this.actor() }, metadata),
    );
  }

  verifyQr(qrPayload: string) {
    return this.call((metadata) =>
      this.client.verifyQr({ qrPayload, ...this.actor() }, metadata),
    );
  }
}
