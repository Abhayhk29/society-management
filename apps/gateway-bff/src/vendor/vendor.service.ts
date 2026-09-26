import { Metadata } from '@grpc/grpc-js';
import { Inject, Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Request } from 'express';
import { firstValueFrom, Observable } from 'rxjs';
import { VENDOR_SERVICE, WORK_ORDER_SERVICE } from 'shared-protos';
import type { GatewayAuthUser } from '../auth/auth-user.type.js';
import { CORE_GRPC } from '../grpc/grpc-clients.module.js';
import { mapGrpcError } from '../grpc/grpc-error.util.js';

type GrpcUnary<TReq, TRes> = (
  data: TReq,
  metadata?: Metadata,
) => Observable<TRes>;

@Injectable({ scope: Scope.REQUEST })
export class VendorGatewayService implements OnModuleInit {
  private vendors!: Record<string, GrpcUnary<unknown, unknown>>;
  private workOrders!: Record<string, GrpcUnary<unknown, unknown>>;

  constructor(
    @Inject(CORE_GRPC) private readonly core: ClientGrpc,
    @Inject(REQUEST)
    private readonly request: Request & { user?: GatewayAuthUser },
  ) {}

  onModuleInit() {
    this.vendors = this.core.getService(VENDOR_SERVICE);
    this.workOrders = this.core.getService(WORK_ORDER_SERVICE);
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

  createVendor(body: Record<string, unknown>) {
    return this.call((m) =>
      this.vendors.createVendor(
        {
          ...this.actor(),
          displayName: body.displayName,
          companyName: body.companyName,
          contactPhone: body.contactPhone ?? '',
          contactEmail: body.contactEmail ?? '',
          categories: body.categories ?? 'GENERAL',
          gstNumber: body.gstNumber ?? '',
          panNumber: body.panNumber ?? '',
          address: body.address ?? '',
          city: body.city ?? '',
          notes: body.notes ?? '',
          userId: body.userId ?? '',
          hasUserId: body.userId != null,
          submitNow: body.submitNow === true,
        },
        m,
      ),
    );
  }

  async listVendors(status?: string, societyId?: string, category?: string) {
    const res = (await this.call((m) =>
      this.vendors.listVendors(
        {
          status: status ?? '',
          hasStatus: Boolean(status),
          societyId: societyId ?? '',
          hasSocietyId: Boolean(societyId),
          category: category ?? '',
          hasCategory: Boolean(category),
        },
        m,
      ),
    )) as { vendors?: unknown[] };
    return res.vendors ?? [];
  }

  getVendor(uid: string) {
    return this.call((m) => this.vendors.getVendor({ uid }, m));
  }

  updateVendor(uid: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.vendors.updateVendor(
        {
          uid,
          displayName: body.displayName ?? '',
          hasDisplayName: body.displayName !== undefined,
          companyName: body.companyName ?? '',
          hasCompanyName: body.companyName !== undefined,
          contactPhone: body.contactPhone ?? '',
          hasContactPhone: body.contactPhone !== undefined,
          contactEmail: body.contactEmail ?? '',
          hasContactEmail: body.contactEmail !== undefined,
          categories: body.categories ?? '',
          hasCategories: body.categories !== undefined,
          gstNumber: body.gstNumber ?? '',
          hasGstNumber: body.gstNumber !== undefined,
          panNumber: body.panNumber ?? '',
          hasPanNumber: body.panNumber !== undefined,
          address: body.address ?? '',
          hasAddress: body.address !== undefined,
          city: body.city ?? '',
          hasCity: body.city !== undefined,
          notes: body.notes ?? '',
          hasNotes: body.notes !== undefined,
          userId: body.userId ?? '',
          hasUserId: body.userId !== undefined && body.userId !== null,
          clearUserId: body.userId === null,
        },
        m,
      ),
    );
  }

  submitVendor(uid: string) {
    return this.call((m) => this.vendors.submitVendor({ uid }, m));
  }

  reviewVendor(uid: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.vendors.reviewVendor(
        {
          uid,
          ...this.actor(),
          approve: Boolean(body.approve),
          rejectionReason: body.rejectionReason ?? '',
        },
        m,
      ),
    );
  }

  suspendVendor(uid: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.vendors.suspendVendor(
        { uid, ...this.actor(), reason: body.reason ?? '' },
        m,
      ),
    );
  }

  addDocument(vendorId: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.vendors.addVendorDocument(
        {
          vendorId,
          ...this.actor(),
          docType: body.docType,
          label: body.label,
          referenceOrUrl: body.referenceOrUrl,
          notes: body.notes ?? '',
        },
        m,
      ),
    );
  }

  async listDocuments(uid: string) {
    const res = (await this.call((m) =>
      this.vendors.listVendorDocuments({ uid }, m),
    )) as { documents?: unknown[] };
    return res.documents ?? [];
  }

  verifyDocument(uid: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.vendors.verifyVendorDocument(
        {
          uid,
          ...this.actor(),
          approve: Boolean(body.approve),
          notes: body.notes ?? '',
        },
        m,
      ),
    );
  }

  assignSociety(vendorId: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.vendors.assignVendorSociety(
        {
          vendorId,
          ...this.actor(),
          societyId: body.societyId,
          notes: body.notes ?? '',
        },
        m,
      ),
    );
  }

  async listSocieties(uid: string) {
    const res = (await this.call((m) =>
      this.vendors.listVendorSocieties({ uid }, m),
    )) as { assignments?: unknown[] };
    return res.assignments ?? [];
  }

  updateSociety(uid: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.vendors.updateVendorSociety(
        {
          uid,
          ...this.actor(),
          status: body.status,
          notes: body.notes ?? '',
        },
        m,
      ),
    );
  }

  createWorkOrder(body: Record<string, unknown>) {
    return this.call((m) =>
      this.workOrders.createWorkOrder(
        {
          ...this.actor(),
          societyId: body.societyId,
          flatId: body.flatId ?? '',
          hasFlatId: body.flatId != null,
          buildingId: body.buildingId ?? '',
          hasBuildingId: body.buildingId != null,
          title: body.title,
          description: body.description,
          category: body.category ?? 'GENERAL',
          priority: body.priority ?? 'NORMAL',
          complaintId: body.complaintId ?? '',
          hasComplaintId: body.complaintId != null,
          scheduledStartAt: body.scheduledStartAt ?? '',
          hasScheduledStartAt: body.scheduledStartAt != null,
          scheduledEndAt: body.scheduledEndAt ?? '',
          hasScheduledEndAt: body.scheduledEndAt != null,
          costEstimate: body.costEstimate ?? 0,
          hasCostEstimate: body.costEstimate != null,
          openNow: body.openNow !== false,
        },
        m,
      ),
    );
  }

  async listWorkOrders(
    societyId: string,
    status?: string,
    vendorId?: string,
    category?: string,
  ) {
    const res = (await this.call((m) =>
      this.workOrders.listWorkOrders(
        {
          societyId,
          status: status ?? '',
          hasStatus: Boolean(status),
          vendorId: vendorId ?? '',
          hasVendorId: Boolean(vendorId),
          category: category ?? '',
          hasCategory: Boolean(category),
        },
        m,
      ),
    )) as { workOrders?: unknown[] };
    return res.workOrders ?? [];
  }

  getWorkOrder(uid: string) {
    return this.call((m) => this.workOrders.getWorkOrder({ uid }, m));
  }

  updateWorkOrder(uid: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.workOrders.updateWorkOrder(
        {
          uid,
          ...this.actor(),
          title: body.title ?? '',
          hasTitle: body.title !== undefined,
          description: body.description ?? '',
          hasDescription: body.description !== undefined,
          category: body.category ?? '',
          hasCategory: body.category !== undefined,
          priority: body.priority ?? '',
          hasPriority: body.priority !== undefined,
          scheduledStartAt: body.scheduledStartAt ?? '',
          hasScheduledStartAt:
            body.scheduledStartAt !== undefined &&
            body.scheduledStartAt !== null,
          clearScheduledStartAt: body.scheduledStartAt === null,
          scheduledEndAt: body.scheduledEndAt ?? '',
          hasScheduledEndAt:
            body.scheduledEndAt !== undefined && body.scheduledEndAt !== null,
          clearScheduledEndAt: body.scheduledEndAt === null,
          costEstimate: body.costEstimate ?? 0,
          hasCostEstimate:
            body.costEstimate !== undefined && body.costEstimate !== null,
          clearCostEstimate: body.costEstimate === null,
        },
        m,
      ),
    );
  }

  assignWorkOrder(uid: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.workOrders.assignWorkOrder(
        {
          uid,
          ...this.actor(),
          vendorId: body.vendorId,
          scheduledStartAt: body.scheduledStartAt ?? '',
          hasScheduledStartAt: body.scheduledStartAt != null,
          notes: body.notes ?? '',
        },
        m,
      ),
    );
  }

  startWorkOrder(uid: string) {
    return this.call((m) =>
      this.workOrders.startWorkOrder({ uid, ...this.actor() }, m),
    );
  }

  completeWorkOrder(uid: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.workOrders.completeWorkOrder(
        {
          uid,
          ...this.actor(),
          actualCost: body.actualCost ?? 0,
          hasActualCost: body.actualCost != null,
          resolutionNotes: body.resolutionNotes ?? '',
        },
        m,
      ),
    );
  }

  verifyWorkOrder(uid: string) {
    return this.call((m) =>
      this.workOrders.verifyWorkOrder({ uid, ...this.actor() }, m),
    );
  }

  holdWorkOrder(uid: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.workOrders.holdWorkOrder(
        { uid, ...this.actor(), reason: body.reason ?? '' },
        m,
      ),
    );
  }

  cancelWorkOrder(uid: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.workOrders.cancelWorkOrder(
        { uid, ...this.actor(), reason: body.reason ?? '' },
        m,
      ),
    );
  }

  proposeQuote(workOrderId: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.workOrders.proposeQuote(
        {
          workOrderId,
          ...this.actor(),
          vendorId: body.vendorId,
          amount: body.amount,
          notes: body.notes ?? '',
        },
        m,
      ),
    );
  }

  decideQuote(uid: string, body: Record<string, unknown>) {
    return this.call((m) =>
      this.workOrders.decideQuote(
        {
          uid,
          ...this.actor(),
          accept: Boolean(body.accept),
          notes: body.notes ?? '',
        },
        m,
      ),
    );
  }

  async listQuotes(uid: string) {
    const res = (await this.call((m) =>
      this.workOrders.listQuotes({ uid }, m),
    )) as { quotes?: unknown[] };
    return res.quotes ?? [];
  }

  async listEvents(uid: string) {
    const res = (await this.call((m) =>
      this.workOrders.listEvents({ uid }, m),
    )) as { events?: unknown[] };
    return res.events ?? [];
  }
}
