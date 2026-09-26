import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { ComplaintsService } from '../community/complaints.service.js';
import { NoticesService } from '../community/notices.service.js';
import { VisitorsService } from '../community/visitors.service.js';
import { dateToString, toRpcException } from './grpc-exception.util.js';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NoticeGrpcController {
  constructor(private readonly noticesService: NoticesService) {}

  @GrpcMethod('NoticeService', 'CreateNotice')
  @RequirePermissions('manage:notice')
  async createNotice(data: any) {
    try {
      const n = await this.noticesService.create(
        {
          societyId: data.societyId,
          title: data.title,
          body: data.body,
          priority: data.priority || 'NORMAL',
          publishedAt: data.publishedAt || undefined,
          expiresAt: data.hasExpiresAt ? data.expiresAt : undefined,
        },
        data.actorUserId,
      );
      return this.map(n);
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('NoticeService', 'ListNotices')
  @RequirePermissions('view:notice')
  async listNotices(data: { societyId: string; activeOnly?: boolean }) {
    try {
      const notices = await this.noticesService.list(
        data.societyId,
        Boolean(data.activeOnly),
      );
      return { notices: notices.map((n) => this.map(n)) };
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('NoticeService', 'GetNotice')
  @RequirePermissions('view:notice')
  async getNotice(data: { uid: string }) {
    try {
      return this.map(await this.noticesService.findOne(data.uid));
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('NoticeService', 'UpdateNotice')
  @RequirePermissions('manage:notice')
  async updateNotice(data: any) {
    try {
      return this.map(
        await this.noticesService.update(data.uid, {
          title: data.hasTitle ? data.title : undefined,
          body: data.hasBody ? data.body : undefined,
          priority: data.hasPriority ? data.priority : undefined,
          expiresAt: data.clearExpiresAt
            ? null
            : data.hasExpiresAt
              ? data.expiresAt
              : undefined,
          isActive: data.hasIsActive ? data.isActive : undefined,
        }),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('NoticeService', 'DeleteNotice')
  @RequirePermissions('manage:notice')
  async deleteNotice(data: { uid: string }) {
    try {
      return this.map(await this.noticesService.remove(data.uid));
    } catch (e) {
      throw toRpcException(e);
    }
  }

  private map(n: Awaited<ReturnType<NoticesService['findOne']>>) {
    return {
      uid: n.uid,
      societyId: n.societyId,
      title: n.title,
      body: n.body,
      priority: n.priority,
      publishedAt: dateToString(n.publishedAt),
      expiresAt: dateToString(n.expiresAt),
      createdByUserId: n.createdByUserId,
      isActive: n.isActive,
      createdAt: dateToString(n.createdAt),
      updatedAt: dateToString(n.updatedAt),
    };
  }
}

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ComplaintGrpcController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @GrpcMethod('ComplaintService', 'CreateComplaint')
  @RequirePermissions('create:complaint')
  async createComplaint(data: any) {
    try {
      return this.map(
        await this.complaintsService.create(
          {
            societyId: data.societyId,
            flatId: data.hasFlatId ? data.flatId : undefined,
            category: data.category,
            title: data.title,
            description: data.description,
          },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('ComplaintService', 'ListComplaints')
  @RequirePermissions('view:complaint')
  async listComplaints(data: {
    societyId: string;
    status?: string;
    hasStatus?: boolean;
  }) {
    try {
      const complaints = await this.complaintsService.list(
        data.societyId,
        data.hasStatus ? data.status : undefined,
      );
      return { complaints: complaints.map((c) => this.map(c)) };
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('ComplaintService', 'GetComplaint')
  @RequirePermissions('view:complaint')
  async getComplaint(data: { uid: string }) {
    try {
      return this.map(await this.complaintsService.findOne(data.uid));
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('ComplaintService', 'UpdateComplaint')
  @RequirePermissions('manage:complaint')
  async updateComplaint(data: any) {
    try {
      return this.map(
        await this.complaintsService.update(data.uid, {
          status: data.hasStatus ? data.status : undefined,
          assignedToUserId: data.clearAssignedToUserId
            ? null
            : data.hasAssignedToUserId
              ? data.assignedToUserId
              : undefined,
          resolutionNotes: data.clearResolutionNotes
            ? null
            : data.hasResolutionNotes
              ? data.resolutionNotes
              : undefined,
        }),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  private map(c: Awaited<ReturnType<ComplaintsService['findOne']>>) {
    return {
      uid: c.uid,
      societyId: c.societyId,
      flatId: c.flatId ?? '',
      hasFlatId: c.flatId !== null,
      raisedByUserId: c.raisedByUserId,
      category: c.category,
      title: c.title,
      description: c.description,
      status: c.status,
      assignedToUserId: c.assignedToUserId ?? '',
      resolutionNotes: c.resolutionNotes ?? '',
      createdAt: dateToString(c.createdAt),
      updatedAt: dateToString(c.updatedAt),
    };
  }
}

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VisitorGrpcController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @GrpcMethod('VisitorService', 'CreateVisitor')
  @RequirePermissions('manage:visitor')
  async createVisitor(data: any) {
    try {
      return this.map(
        await this.visitorsService.create(
          {
            societyId: data.societyId,
            flatId: data.hasFlatId ? data.flatId : undefined,
            hostUserId: data.hostUserId || undefined,
            visitorName: data.visitorName,
            visitorPhone: data.visitorPhone || undefined,
            purpose: data.purpose || undefined,
            expectedAt: data.expectedAt,
            gatePassId: data.hasGatePassId ? data.gatePassId : undefined,
          },
          data.actorUserId,
        ),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VisitorService', 'ListVisitors')
  @RequirePermissions('view:visitor')
  async listVisitors(data: {
    societyId: string;
    status?: string;
    hasStatus?: boolean;
  }) {
    try {
      const visitors = await this.visitorsService.list(
        data.societyId,
        data.hasStatus ? data.status : undefined,
      );
      return { visitors: visitors.map((v) => this.map(v)) };
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VisitorService', 'GetVisitor')
  @RequirePermissions('view:visitor')
  async getVisitor(data: { uid: string }) {
    try {
      return this.map(await this.visitorsService.findOne(data.uid));
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VisitorService', 'UpdateVisitor')
  @RequirePermissions('manage:visitor')
  async updateVisitor(data: any) {
    try {
      return this.map(
        await this.visitorsService.update(data.uid, {
          visitorName: data.hasVisitorName ? data.visitorName : undefined,
          visitorPhone: data.clearVisitorPhone
            ? null
            : data.hasVisitorPhone
              ? data.visitorPhone
              : undefined,
          purpose: data.clearPurpose
            ? null
            : data.hasPurpose
              ? data.purpose
              : undefined,
          expectedAt: data.hasExpectedAt ? data.expectedAt : undefined,
          gatePassId: data.clearGatePassId
            ? null
            : data.hasGatePassId
              ? data.gatePassId
              : undefined,
        }),
      );
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VisitorService', 'CheckInVisitor')
  @RequirePermissions('manage:visitor')
  async checkInVisitor(data: { uid: string }) {
    try {
      return this.map(await this.visitorsService.checkIn(data.uid));
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VisitorService', 'CheckOutVisitor')
  @RequirePermissions('manage:visitor')
  async checkOutVisitor(data: { uid: string }) {
    try {
      return this.map(await this.visitorsService.checkOut(data.uid));
    } catch (e) {
      throw toRpcException(e);
    }
  }

  @GrpcMethod('VisitorService', 'CancelVisitor')
  @RequirePermissions('manage:visitor')
  async cancelVisitor(data: { uid: string }) {
    try {
      return this.map(await this.visitorsService.cancel(data.uid));
    } catch (e) {
      throw toRpcException(e);
    }
  }

  private map(v: Awaited<ReturnType<VisitorsService['findOne']>>) {
    return {
      uid: v.uid,
      societyId: v.societyId,
      flatId: v.flatId ?? '',
      hasFlatId: v.flatId !== null,
      hostUserId: v.hostUserId,
      visitorName: v.visitorName,
      visitorPhone: v.visitorPhone ?? '',
      purpose: v.purpose ?? '',
      expectedAt: dateToString(v.expectedAt),
      status: v.status,
      checkedInAt: dateToString(v.checkedInAt),
      checkedOutAt: dateToString(v.checkedOutAt),
      gatePassId: v.gatePassId ?? '',
      hasGatePassId: v.gatePassId !== null,
      createdAt: dateToString(v.createdAt),
      updatedAt: dateToString(v.updatedAt),
    };
  }
}
