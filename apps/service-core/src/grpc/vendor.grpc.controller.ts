import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { VendorsService } from '../vendor/vendors.service.js';
import { WorkOrdersService } from '../vendor/work-orders.service.js';
import { dateToString, toRpcException } from './grpc-exception.util.js';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VendorGrpcController {
  constructor(private readonly vendorsService: VendorsService) {}

  @GrpcMethod('VendorService', 'CreateVendor')
  @RequirePermissions('manage:vendor')
  async createVendor(data: any) {
    try {
      return this.mapVendor(
        await this.vendorsService.create(
          {
            displayName: data.displayName,
            companyName: data.companyName,
            contactPhone: data.contactPhone || undefined,
            contactEmail: data.contactEmail || undefined,
            categories: data.categories || undefined,
            gstNumber: data.gstNumber || undefined,
            panNumber: data.panNumber || undefined,
            address: data.address || undefined,
            city: data.city || undefined,
            notes: data.notes || undefined,
            userId: data.hasUserId ? data.userId : undefined,
            submitNow: Boolean(data.submitNow),
          },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VendorService', 'ListVendors')
  @RequirePermissions('view:vendor')
  async listVendors(data: any) {
    try {
      const vendors = await this.vendorsService.list({
        status: data.hasStatus ? data.status : undefined,
        societyId: data.hasSocietyId ? data.societyId : undefined,
        category: data.hasCategory ? data.category : undefined,
      });
      return { vendors: vendors.map((v) => this.mapVendor(v)) };
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VendorService', 'GetVendor')
  @RequirePermissions('view:vendor')
  async getVendor(data: { uid: string }) {
    try {
      return this.mapVendor(await this.vendorsService.findOne(data.uid));
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VendorService', 'UpdateVendor')
  @RequirePermissions('manage:vendor')
  async updateVendor(data: any) {
    try {
      return this.mapVendor(
        await this.vendorsService.update(data.uid, {
          displayName: data.hasDisplayName ? data.displayName : undefined,
          companyName: data.hasCompanyName ? data.companyName : undefined,
          contactPhone: data.hasContactPhone ? data.contactPhone : undefined,
          contactEmail: data.hasContactEmail ? data.contactEmail : undefined,
          categories: data.hasCategories ? data.categories : undefined,
          gstNumber: data.hasGstNumber ? data.gstNumber : undefined,
          panNumber: data.hasPanNumber ? data.panNumber : undefined,
          address: data.hasAddress ? data.address : undefined,
          city: data.hasCity ? data.city : undefined,
          notes: data.hasNotes ? data.notes : undefined,
          userId: data.clearUserId
            ? null
            : data.hasUserId
              ? data.userId
              : undefined,
        }),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VendorService', 'SubmitVendor')
  @RequirePermissions('manage:vendor')
  async submitVendor(data: { uid: string }) {
    try {
      return this.mapVendor(await this.vendorsService.submit(data.uid));
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VendorService', 'ReviewVendor')
  @RequirePermissions('manage:vendor')
  async reviewVendor(data: any) {
    try {
      return this.mapVendor(
        await this.vendorsService.review(
          data.uid,
          {
            approve: Boolean(data.approve),
            rejectionReason: data.rejectionReason || undefined,
          },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VendorService', 'SuspendVendor')
  @RequirePermissions('manage:vendor')
  async suspendVendor(data: any) {
    try {
      return this.mapVendor(
        await this.vendorsService.suspend(
          data.uid,
          { reason: data.reason || undefined },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VendorService', 'AddVendorDocument')
  @RequirePermissions('manage:vendor')
  async addVendorDocument(data: any) {
    try {
      return this.mapDoc(
        await this.vendorsService.addDocument(data.vendorId, {
          docType: data.docType,
          label: data.label,
          referenceOrUrl: data.referenceOrUrl,
          notes: data.notes || undefined,
        }),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VendorService', 'ListVendorDocuments')
  @RequirePermissions('view:vendor')
  async listVendorDocuments(data: { uid: string }) {
    try {
      const documents = await this.vendorsService.listDocuments(data.uid);
      return { documents: documents.map((d) => this.mapDoc(d)) };
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VendorService', 'VerifyVendorDocument')
  @RequirePermissions('manage:vendor')
  async verifyVendorDocument(data: any) {
    try {
      return this.mapDoc(
        await this.vendorsService.verifyDocument(
          data.uid,
          {
            approve: Boolean(data.approve),
            notes: data.notes || undefined,
          },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VendorService', 'AssignVendorSociety')
  @RequirePermissions('manage:vendor')
  async assignVendorSociety(data: any) {
    try {
      return this.mapAssign(
        await this.vendorsService.assignSociety(
          data.vendorId,
          { societyId: data.societyId, notes: data.notes || undefined },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VendorService', 'ListVendorSocieties')
  @RequirePermissions('view:vendor')
  async listVendorSocieties(data: { uid: string }) {
    try {
      const assignments = await this.vendorsService.listSocieties(data.uid);
      return { assignments: assignments.map((a) => this.mapAssign(a)) };
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VendorService', 'UpdateVendorSociety')
  @RequirePermissions('manage:vendor')
  async updateVendorSociety(data: any) {
    try {
      return this.mapAssign(
        await this.vendorsService.updateSocietyAssign(
          data.uid,
          { status: data.status, notes: data.notes || undefined },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  private mapVendor(v: Awaited<ReturnType<VendorsService['findOne']>>) {
    return {
      uid: v.uid,
      displayName: v.displayName,
      companyName: v.companyName,
      contactPhone: v.contactPhone ?? '',
      contactEmail: v.contactEmail ?? '',
      categories: v.categories,
      status: v.status,
      gstNumber: v.gstNumber ?? '',
      panNumber: v.panNumber ?? '',
      address: v.address ?? '',
      city: v.city ?? '',
      notes: v.notes ?? '',
      userId: v.userId ?? '',
      createdByUserId: v.createdByUserId,
      reviewedByUserId: v.reviewedByUserId ?? '',
      reviewedAt: dateToString(v.reviewedAt),
      rejectionReason: v.rejectionReason ?? '',
      createdAt: dateToString(v.createdAt),
      updatedAt: dateToString(v.updatedAt),
    };
  }

  private mapDoc(d: Awaited<ReturnType<VendorsService['addDocument']>>) {
    return {
      uid: d.uid,
      vendorId: d.vendorId,
      docType: d.docType,
      label: d.label,
      referenceOrUrl: d.referenceOrUrl,
      status: d.status,
      notes: d.notes ?? '',
      verifiedByUserId: d.verifiedByUserId ?? '',
      verifiedAt: dateToString(d.verifiedAt),
      createdAt: dateToString(d.createdAt),
      updatedAt: dateToString(d.updatedAt),
    };
  }

  private mapAssign(a: Awaited<ReturnType<VendorsService['assignSociety']>>) {
    return {
      uid: a.uid,
      vendorId: a.vendorId,
      societyId: a.societyId,
      status: a.status,
      notes: a.notes ?? '',
      approvedByUserId: a.approvedByUserId ?? '',
      approvedAt: dateToString(a.approvedAt),
      createdAt: dateToString(a.createdAt),
      updatedAt: dateToString(a.updatedAt),
    };
  }
}

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkOrderGrpcController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @GrpcMethod('WorkOrderService', 'CreateWorkOrder')
  @RequirePermissions('create:work_order')
  async createWorkOrder(data: any) {
    try {
      return this.mapOrder(
        await this.workOrdersService.create(
          {
            societyId: data.societyId,
            flatId: data.hasFlatId ? data.flatId : undefined,
            buildingId: data.hasBuildingId ? data.buildingId : undefined,
            title: data.title,
            description: data.description,
            category: data.category || undefined,
            priority: data.priority || undefined,
            complaintId: data.hasComplaintId ? data.complaintId : undefined,
            scheduledStartAt: data.hasScheduledStartAt
              ? data.scheduledStartAt
              : undefined,
            scheduledEndAt: data.hasScheduledEndAt
              ? data.scheduledEndAt
              : undefined,
            costEstimate: data.hasCostEstimate ? data.costEstimate : undefined,
            openNow: data.openNow !== false,
          },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('WorkOrderService', 'ListWorkOrders')
  @RequirePermissions('view:work_order')
  async listWorkOrders(data: any) {
    try {
      const workOrders = await this.workOrdersService.list({
        societyId: data.societyId,
        status: data.hasStatus ? data.status : undefined,
        vendorId: data.hasVendorId ? data.vendorId : undefined,
        category: data.hasCategory ? data.category : undefined,
      });
      return { workOrders: workOrders.map((w) => this.mapOrder(w)) };
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('WorkOrderService', 'GetWorkOrder')
  @RequirePermissions('view:work_order')
  async getWorkOrder(data: { uid: string }) {
    try {
      return this.mapOrder(await this.workOrdersService.findOne(data.uid));
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('WorkOrderService', 'UpdateWorkOrder')
  @RequirePermissions('manage:work_order')
  async updateWorkOrder(data: any) {
    try {
      return this.mapOrder(
        await this.workOrdersService.update(
          data.uid,
          {
            title: data.hasTitle ? data.title : undefined,
            description: data.hasDescription ? data.description : undefined,
            category: data.hasCategory ? data.category : undefined,
            priority: data.hasPriority ? data.priority : undefined,
            scheduledStartAt: data.clearScheduledStartAt
              ? null
              : data.hasScheduledStartAt
                ? data.scheduledStartAt
                : undefined,
            scheduledEndAt: data.clearScheduledEndAt
              ? null
              : data.hasScheduledEndAt
                ? data.scheduledEndAt
                : undefined,
            costEstimate: data.clearCostEstimate
              ? null
              : data.hasCostEstimate
                ? data.costEstimate
                : undefined,
          },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('WorkOrderService', 'AssignWorkOrder')
  @RequirePermissions('manage:work_order')
  async assignWorkOrder(data: any) {
    try {
      return this.mapOrder(
        await this.workOrdersService.assign(
          data.uid,
          {
            vendorId: data.vendorId,
            scheduledStartAt: data.hasScheduledStartAt
              ? data.scheduledStartAt
              : undefined,
            notes: data.notes || undefined,
          },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('WorkOrderService', 'StartWorkOrder')
  @RequirePermissions('update:work_order')
  async startWorkOrder(data: any) {
    try {
      return this.mapOrder(
        await this.workOrdersService.start(data.uid, data.actorUserId),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('WorkOrderService', 'CompleteWorkOrder')
  @RequirePermissions('update:work_order')
  async completeWorkOrder(data: any) {
    try {
      return this.mapOrder(
        await this.workOrdersService.complete(
          data.uid,
          {
            actualCost: data.hasActualCost ? data.actualCost : undefined,
            resolutionNotes: data.resolutionNotes || undefined,
          },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('WorkOrderService', 'VerifyWorkOrder')
  @RequirePermissions('manage:work_order')
  async verifyWorkOrder(data: any) {
    try {
      return this.mapOrder(
        await this.workOrdersService.verify(data.uid, data.actorUserId),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('WorkOrderService', 'HoldWorkOrder')
  @RequirePermissions('update:work_order')
  async holdWorkOrder(data: any) {
    try {
      return this.mapOrder(
        await this.workOrdersService.hold(
          data.uid,
          { reason: data.reason || undefined },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('WorkOrderService', 'CancelWorkOrder')
  @RequirePermissions('manage:work_order')
  async cancelWorkOrder(data: any) {
    try {
      return this.mapOrder(
        await this.workOrdersService.cancel(
          data.uid,
          { reason: data.reason || undefined },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('WorkOrderService', 'ProposeQuote')
  @RequirePermissions('update:work_order')
  async proposeQuote(data: any) {
    try {
      return this.mapQuote(
        await this.workOrdersService.proposeQuote(
          data.workOrderId,
          {
            vendorId: data.vendorId,
            amount: data.amount,
            notes: data.notes || undefined,
          },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('WorkOrderService', 'DecideQuote')
  @RequirePermissions('manage:work_order')
  async decideQuote(data: any) {
    try {
      return this.mapQuote(
        await this.workOrdersService.decideQuote(
          data.uid,
          {
            accept: Boolean(data.accept),
            notes: data.notes || undefined,
          },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('WorkOrderService', 'ListQuotes')
  @RequirePermissions('view:work_order')
  async listQuotes(data: { uid: string }) {
    try {
      const quotes = await this.workOrdersService.listQuotes(data.uid);
      return { quotes: quotes.map((q) => this.mapQuote(q)) };
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('WorkOrderService', 'ListEvents')
  @RequirePermissions('view:work_order')
  async listEvents(data: { uid: string }) {
    try {
      const events = await this.workOrdersService.listEvents(data.uid);
      return { events: events.map((e) => this.mapEvent(e)) };
    } catch (e) {
      throw toRpcException(e);
    }
  }

  private mapOrder(w: Awaited<ReturnType<WorkOrdersService['findOne']>>) {
    return {
      uid: w.uid,
      societyId: w.societyId,
      flatId: w.flatId ?? '',
      buildingId: w.buildingId ?? '',
      title: w.title,
      description: w.description,
      category: w.category,
      priority: w.priority,
      status: w.status,
      requestedByUserId: w.requestedByUserId,
      assignedVendorId: w.assignedVendorId ?? '',
      complaintId: w.complaintId ?? '',
      scheduledStartAt: dateToString(w.scheduledStartAt),
      scheduledEndAt: dateToString(w.scheduledEndAt),
      completedAt: dateToString(w.completedAt),
      verifiedAt: dateToString(w.verifiedAt),
      verifiedByUserId: w.verifiedByUserId ?? '',
      costEstimate: w.costEstimate ?? 0,
      hasCostEstimate: w.costEstimate != null,
      actualCost: w.actualCost ?? 0,
      hasActualCost: w.actualCost != null,
      currency: w.currency,
      resolutionNotes: w.resolutionNotes ?? '',
      createdAt: dateToString(w.createdAt),
      updatedAt: dateToString(w.updatedAt),
    };
  }

  private mapQuote(q: Awaited<ReturnType<WorkOrdersService['proposeQuote']>>) {
    return {
      uid: q.uid,
      workOrderId: q.workOrderId,
      vendorId: q.vendorId,
      amount: q.amount,
      currency: q.currency,
      notes: q.notes ?? '',
      status: q.status,
      proposedByUserId: q.proposedByUserId,
      decidedAt: dateToString(q.decidedAt),
      createdAt: dateToString(q.createdAt),
      updatedAt: dateToString(q.updatedAt),
    };
  }

  private mapEvent(e: Awaited<ReturnType<WorkOrdersService['listEvents']>>[0]) {
    return {
      uid: e.uid,
      workOrderId: e.workOrderId,
      actorUserId: e.actorUserId,
      eventType: e.eventType,
      fromStatus: e.fromStatus ?? '',
      toStatus: e.toStatus ?? '',
      message: e.message ?? '',
      createdAt: dateToString(e.createdAt),
    };
  }
}
