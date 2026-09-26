import { Metadata } from '@grpc/grpc-js';
import { Inject, Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Request } from 'express';
import { firstValueFrom, Observable } from 'rxjs';
import {
  COMPLAINT_SERVICE,
  NOTICE_SERVICE,
  VISITOR_SERVICE,
} from 'shared-protos';
import type { GatewayAuthUser } from '../auth/auth-user.type.js';
import { CORE_GRPC } from '../grpc/grpc-clients.module.js';
import { mapGrpcError } from '../grpc/grpc-error.util.js';

type GrpcUnary = (data: unknown, metadata?: Metadata) => Observable<unknown>;

@Injectable({ scope: Scope.REQUEST })
export class CommunityGatewayService implements OnModuleInit {
  private notices!: Record<string, GrpcUnary>;
  private complaints!: Record<string, GrpcUnary>;
  private visitors!: Record<string, GrpcUnary>;

  constructor(
    @Inject(CORE_GRPC) private readonly core: ClientGrpc,
    @Inject(REQUEST)
    private readonly request: Request & { user?: GatewayAuthUser },
  ) {}

  onModuleInit() {
    this.notices = this.core.getService(NOTICE_SERVICE);
    this.complaints = this.core.getService(COMPLAINT_SERVICE);
    this.visitors = this.core.getService(VISITOR_SERVICE);
  }

  private meta() {
    const metadata = new Metadata();
    const header = this.request.headers?.authorization;
    if (header) metadata.set('authorization', String(header));
    return metadata;
  }

  private actor() {
    return { actorUserId: this.request.user?.uid ?? '' };
  }

  private async call<T>(fn: (m: Metadata) => Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(fn(this.meta()));
    } catch (error) {
      mapGrpcError(error);
    }
  }

  createNotice(body: Record<string, unknown>) {
    return this.call((m) =>
      this.notices.createNotice(
        {
          ...this.actor(),
          societyId: body.societyId,
          title: body.title,
          body: body.body,
          priority: body.priority ?? 'NORMAL',
          publishedAt: body.publishedAt ?? '',
          expiresAt: body.expiresAt ?? '',
          hasExpiresAt: body.expiresAt != null,
        },
        m,
      ),
    );
  }

  async listNotices(societyId: string, activeOnly?: boolean) {
    const res = (await this.call((m) =>
      this.notices.listNotices(
        { societyId, activeOnly: Boolean(activeOnly) },
        m,
      ),
    )) as { notices?: unknown[] };
    return res.notices ?? [];
  }

  getNotice(uid: string) {
    return this.call((m) => this.notices.getNotice({ uid }, m));
  }

  updateNotice(uid: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.notices.updateNotice(
        {
          uid,
          title: body.title ?? '',
          body: body.body ?? '',
          priority: body.priority ?? '',
          expiresAt: body.expiresAt ?? '',
          isActive: body.isActive ?? false,
          hasTitle: body.title !== undefined,
          hasBody: body.body !== undefined,
          hasPriority: body.priority !== undefined,
          hasExpiresAt: body.expiresAt !== undefined && body.expiresAt !== null,
          clearExpiresAt: body.expiresAt === null,
          hasIsActive: body.isActive !== undefined,
        },
        m,
      ),
    );
  }

  deleteNotice(uid: string) {
    return this.call((m) => this.notices.deleteNotice({ uid }, m));
  }

  createComplaint(body: Record<string, unknown>) {
    return this.call((m) =>
      this.complaints.createComplaint(
        {
          ...this.actor(),
          societyId: body.societyId,
          flatId: body.flatId ?? '',
          hasFlatId: body.flatId != null,
          category: body.category,
          title: body.title,
          description: body.description,
        },
        m,
      ),
    );
  }

  async listComplaints(societyId: string, status?: string) {
    const res = (await this.call((m) =>
      this.complaints.listComplaints(
        { societyId, status: status ?? '', hasStatus: Boolean(status) },
        m,
      ),
    )) as { complaints?: unknown[] };
    return res.complaints ?? [];
  }

  getComplaint(uid: string) {
    return this.call((m) => this.complaints.getComplaint({ uid }, m));
  }

  updateComplaint(uid: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.complaints.updateComplaint(
        {
          uid,
          status: body.status ?? '',
          assignedToUserId: body.assignedToUserId ?? '',
          resolutionNotes: body.resolutionNotes ?? '',
          hasStatus: body.status !== undefined,
          hasAssignedToUserId:
            body.assignedToUserId !== undefined &&
            body.assignedToUserId !== null,
          clearAssignedToUserId: body.assignedToUserId === null,
          hasResolutionNotes:
            body.resolutionNotes !== undefined && body.resolutionNotes !== null,
          clearResolutionNotes: body.resolutionNotes === null,
        },
        m,
      ),
    );
  }

  createVisitor(body: Record<string, unknown>) {
    return this.call((m) =>
      this.visitors.createVisitor(
        {
          ...this.actor(),
          societyId: body.societyId,
          flatId: body.flatId ?? '',
          hasFlatId: body.flatId != null,
          hostUserId: body.hostUserId ?? '',
          visitorName: body.visitorName,
          visitorPhone: body.visitorPhone ?? '',
          purpose: body.purpose ?? '',
          expectedAt: body.expectedAt,
          gatePassId: body.gatePassId ?? '',
          hasGatePassId: body.gatePassId != null,
        },
        m,
      ),
    );
  }

  async listVisitors(societyId: string, status?: string) {
    const res = (await this.call((m) =>
      this.visitors.listVisitors(
        { societyId, status: status ?? '', hasStatus: Boolean(status) },
        m,
      ),
    )) as { visitors?: unknown[] };
    return res.visitors ?? [];
  }

  getVisitor(uid: string) {
    return this.call((m) => this.visitors.getVisitor({ uid }, m));
  }

  updateVisitor(uid: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.visitors.updateVisitor(
        {
          uid,
          visitorName: body.visitorName ?? '',
          visitorPhone: body.visitorPhone ?? '',
          purpose: body.purpose ?? '',
          expectedAt: body.expectedAt ?? '',
          gatePassId: body.gatePassId ?? '',
          hasVisitorName: body.visitorName !== undefined,
          hasVisitorPhone:
            body.visitorPhone !== undefined && body.visitorPhone !== null,
          clearVisitorPhone: body.visitorPhone === null,
          hasPurpose: body.purpose !== undefined && body.purpose !== null,
          clearPurpose: body.purpose === null,
          hasExpectedAt: body.expectedAt !== undefined,
          hasGatePassId:
            body.gatePassId !== undefined && body.gatePassId !== null,
          clearGatePassId: body.gatePassId === null,
        },
        m,
      ),
    );
  }

  checkIn(uid: string) {
    return this.call((m) => this.visitors.checkInVisitor({ uid }, m));
  }

  checkOut(uid: string) {
    return this.call((m) => this.visitors.checkOutVisitor({ uid }, m));
  }

  cancelVisitor(uid: string) {
    return this.call((m) => this.visitors.cancelVisitor({ uid }, m));
  }
}
