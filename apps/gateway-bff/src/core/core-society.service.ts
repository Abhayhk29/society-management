import { Metadata } from '@grpc/grpc-js';
import { Inject, Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Request } from 'express';
import { firstValueFrom, Observable } from 'rxjs';
import {
  BUILDING_SERVICE,
  FLAT_SERVICE,
  MEMBERSHIP_SERVICE,
  SOCIETY_SERVICE,
} from 'shared-protos';
import { CORE_GRPC } from '../grpc/grpc-clients.module.js';
import { mapGrpcError } from '../grpc/grpc-error.util.js';

type GrpcUnary<TReq, TRes> = (
  data: TReq,
  metadata?: Metadata,
) => Observable<TRes>;

interface SocietyServiceClient {
  createSociety: GrpcUnary<unknown, unknown>;
  listSocieties: GrpcUnary<unknown, { societies: unknown[] }>;
  getSociety: GrpcUnary<{ uid: string }, unknown>;
  updateSociety: GrpcUnary<unknown, unknown>;
  deleteSociety: GrpcUnary<{ uid: string }, unknown>;
}

interface BuildingServiceClient {
  createBuilding: GrpcUnary<unknown, unknown>;
  listBuildingsBySociety: GrpcUnary<{ uid: string }, { buildings: unknown[] }>;
  getBuilding: GrpcUnary<{ uid: string }, unknown>;
  updateBuilding: GrpcUnary<unknown, unknown>;
  deleteBuilding: GrpcUnary<{ uid: string }, unknown>;
}

interface FlatServiceClient {
  createFlat: GrpcUnary<unknown, unknown>;
  listFlatsByBuilding: GrpcUnary<{ uid: string }, { flats: unknown[] }>;
  getFlat: GrpcUnary<{ uid: string }, unknown>;
  updateFlat: GrpcUnary<unknown, unknown>;
  deleteFlat: GrpcUnary<{ uid: string }, unknown>;
}

interface MembershipServiceClient {
  createMembership: GrpcUnary<unknown, unknown>;
  listMembershipsBySociety: GrpcUnary<
    { uid: string },
    { memberships: unknown[] }
  >;
  listMembershipsByUser: GrpcUnary<{ uid: string }, { memberships: unknown[] }>;
  getMembership: GrpcUnary<{ uid: string }, unknown>;
  updateMembership: GrpcUnary<unknown, unknown>;
  deleteMembership: GrpcUnary<{ uid: string }, unknown>;
}

@Injectable({ scope: Scope.REQUEST })
export class CoreSocietyService implements OnModuleInit {
  private societies!: SocietyServiceClient;
  private buildings!: BuildingServiceClient;
  private flats!: FlatServiceClient;
  private memberships!: MembershipServiceClient;

  constructor(
    @Inject(CORE_GRPC) private readonly coreClient: ClientGrpc,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  onModuleInit() {
    this.societies =
      this.coreClient.getService<SocietyServiceClient>(SOCIETY_SERVICE);
    this.buildings =
      this.coreClient.getService<BuildingServiceClient>(BUILDING_SERVICE);
    this.flats = this.coreClient.getService<FlatServiceClient>(FLAT_SERVICE);
    this.memberships =
      this.coreClient.getService<MembershipServiceClient>(MEMBERSHIP_SERVICE);
  }

  private authMetadata(): Metadata {
    const metadata = new Metadata();
    const header = this.request.headers?.authorization;
    if (header) {
      metadata.set('authorization', String(header));
    }
    return metadata;
  }

  private async call<T>(fn: (metadata: Metadata) => Observable<T>): Promise<T> {
    try {
      return await firstValueFrom(fn(this.authMetadata()));
    } catch (error) {
      mapGrpcError(error);
    }
  }

  createSociety(body: Record<string, unknown>) {
    return this.call((metadata) =>
      this.societies.createSociety(
        {
          name: body.name,
          code: body.code,
          address: body.address ?? '',
          city: body.city ?? '',
          state: body.state ?? '',
          pincode: body.pincode ?? '',
          description: body.description ?? '',
          isActive: body.isActive ?? true,
          hasIsActive: body.isActive !== undefined,
        },
        metadata,
      ),
    );
  }

  async listSocieties() {
    const res = await this.call((metadata) =>
      this.societies.listSocieties({}, metadata),
    );
    return res.societies ?? [];
  }

  getSociety(uid: string) {
    return this.call((metadata) =>
      this.societies.getSociety({ uid }, metadata),
    );
  }

  updateSociety(uid: string, body: Record<string, unknown>) {
    return this.call((metadata) =>
      this.societies.updateSociety(
        {
          uid,
          name: body.name ?? '',
          code: body.code ?? '',
          address: body.address ?? '',
          city: body.city ?? '',
          state: body.state ?? '',
          pincode: body.pincode ?? '',
          description: body.description ?? '',
          isActive: body.isActive ?? false,
          hasName: body.name !== undefined,
          hasCode: body.code !== undefined,
          hasAddress: body.address !== undefined && body.address !== null,
          hasCity: body.city !== undefined && body.city !== null,
          hasState: body.state !== undefined && body.state !== null,
          hasPincode: body.pincode !== undefined && body.pincode !== null,
          hasDescription:
            body.description !== undefined && body.description !== null,
          hasIsActive: body.isActive !== undefined,
          clearAddress: body.address === null,
          clearCity: body.city === null,
          clearState: body.state === null,
          clearPincode: body.pincode === null,
          clearDescription: body.description === null,
        },
        metadata,
      ),
    );
  }

  deleteSociety(uid: string) {
    return this.call((metadata) =>
      this.societies.deleteSociety({ uid }, metadata),
    );
  }

  createBuilding(body: Record<string, unknown>) {
    return this.call((metadata) =>
      this.buildings.createBuilding(
        {
          societyId: body.societyId,
          name: body.name,
          code: body.code,
          totalFloors: body.totalFloors ?? 0,
          description: body.description ?? '',
          isActive: body.isActive ?? true,
          hasTotalFloors: body.totalFloors !== undefined,
          hasIsActive: body.isActive !== undefined,
        },
        metadata,
      ),
    );
  }

  async listBuildingsBySociety(societyId: string) {
    const res = await this.call((metadata) =>
      this.buildings.listBuildingsBySociety({ uid: societyId }, metadata),
    );
    return res.buildings ?? [];
  }

  getBuilding(uid: string) {
    return this.call((metadata) =>
      this.buildings.getBuilding({ uid }, metadata),
    );
  }

  updateBuilding(uid: string, body: Record<string, unknown>) {
    return this.call((metadata) =>
      this.buildings.updateBuilding(
        {
          uid,
          name: body.name ?? '',
          code: body.code ?? '',
          totalFloors: body.totalFloors ?? 0,
          description: body.description ?? '',
          isActive: body.isActive ?? false,
          hasName: body.name !== undefined,
          hasCode: body.code !== undefined,
          hasTotalFloors:
            body.totalFloors !== undefined && body.totalFloors !== null,
          hasDescription:
            body.description !== undefined && body.description !== null,
          hasIsActive: body.isActive !== undefined,
          clearTotalFloors: body.totalFloors === null,
          clearDescription: body.description === null,
        },
        metadata,
      ),
    );
  }

  deleteBuilding(uid: string) {
    return this.call((metadata) =>
      this.buildings.deleteBuilding({ uid }, metadata),
    );
  }

  createFlat(body: Record<string, unknown>) {
    return this.call((metadata) =>
      this.flats.createFlat(
        {
          buildingId: body.buildingId,
          number: body.number,
          floor: body.floor ?? 0,
          unitType: body.unitType ?? '',
          areaSqFt: body.areaSqFt ?? 0,
          description: body.description ?? '',
          isActive: body.isActive ?? true,
          hasFloor: body.floor !== undefined,
          hasAreaSqFt: body.areaSqFt !== undefined,
          hasIsActive: body.isActive !== undefined,
        },
        metadata,
      ),
    );
  }

  async listFlatsByBuilding(buildingId: string) {
    const res = await this.call((metadata) =>
      this.flats.listFlatsByBuilding({ uid: buildingId }, metadata),
    );
    return res.flats ?? [];
  }

  getFlat(uid: string) {
    return this.call((metadata) => this.flats.getFlat({ uid }, metadata));
  }

  updateFlat(uid: string, body: Record<string, unknown>) {
    return this.call((metadata) =>
      this.flats.updateFlat(
        {
          uid,
          number: body.number ?? '',
          floor: body.floor ?? 0,
          unitType: body.unitType ?? '',
          areaSqFt: body.areaSqFt ?? 0,
          description: body.description ?? '',
          isActive: body.isActive ?? false,
          hasNumber: body.number !== undefined,
          hasFloor: body.floor !== undefined && body.floor !== null,
          hasUnitType: body.unitType !== undefined && body.unitType !== null,
          hasAreaSqFt: body.areaSqFt !== undefined && body.areaSqFt !== null,
          hasDescription:
            body.description !== undefined && body.description !== null,
          hasIsActive: body.isActive !== undefined,
          clearFloor: body.floor === null,
          clearUnitType: body.unitType === null,
          clearAreaSqFt: body.areaSqFt === null,
          clearDescription: body.description === null,
        },
        metadata,
      ),
    );
  }

  deleteFlat(uid: string) {
    return this.call((metadata) => this.flats.deleteFlat({ uid }, metadata));
  }

  createMembership(body: Record<string, unknown>) {
    return this.call((metadata) =>
      this.memberships.createMembership(
        {
          userId: body.userId,
          societyId: body.societyId,
          flatId: body.flatId ?? '',
          type: body.type,
          status: body.status ?? 'ACTIVE',
          isPrimary: body.isPrimary ?? false,
          startedAt: body.startedAt ?? '',
          endedAt: body.endedAt ?? '',
          hasFlatId: body.flatId !== undefined && body.flatId !== null,
          hasStatus: body.status !== undefined,
          hasIsPrimary: body.isPrimary !== undefined,
        },
        metadata,
      ),
    );
  }

  async listMembershipsBySociety(societyId: string) {
    const res = await this.call((metadata) =>
      this.memberships.listMembershipsBySociety({ uid: societyId }, metadata),
    );
    return res.memberships ?? [];
  }

  async listMembershipsByUser(userId: string) {
    const res = await this.call((metadata) =>
      this.memberships.listMembershipsByUser({ uid: userId }, metadata),
    );
    return res.memberships ?? [];
  }

  getMembership(uid: string) {
    return this.call((metadata) =>
      this.memberships.getMembership({ uid }, metadata),
    );
  }

  updateMembership(uid: string, body: Record<string, unknown>) {
    return this.call((metadata) =>
      this.memberships.updateMembership(
        {
          uid,
          flatId: body.flatId ?? '',
          type: body.type ?? '',
          status: body.status ?? '',
          isPrimary: body.isPrimary ?? false,
          startedAt: body.startedAt ?? '',
          endedAt: body.endedAt ?? '',
          hasFlatId: body.flatId !== undefined && body.flatId !== null,
          clearFlatId: body.flatId === null,
          hasType: body.type !== undefined,
          hasStatus: body.status !== undefined,
          hasIsPrimary: body.isPrimary !== undefined,
          hasStartedAt: body.startedAt !== undefined && body.startedAt !== null,
          clearStartedAt: body.startedAt === null,
          hasEndedAt: body.endedAt !== undefined && body.endedAt !== null,
          clearEndedAt: body.endedAt === null,
        },
        metadata,
      ),
    );
  }

  deleteMembership(uid: string) {
    return this.call((metadata) =>
      this.memberships.deleteMembership({ uid }, metadata),
    );
  }
}
