import { Controller, UseGuards } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { BuildingsService } from '../society/buildings.service.js';
import { FlatsService } from '../society/flats.service.js';
import { MembershipsService } from '../society/memberships.service.js';
import { SocietiesService } from '../society/societies.service.js';
import { toRpcException } from './grpc-exception.util.js';
import {
  mapBuilding,
  mapFlat,
  mapMembership,
  mapSociety,
} from './society-grpc.mapper.js';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SocietyGrpcController {
  constructor(private readonly societiesService: SocietiesService) {}

  @GrpcMethod('SocietyService', 'CreateSociety')
  @RequirePermissions('manage:society')
  async createSociety(data: {
    name: string;
    code: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    description?: string;
    isActive?: boolean;
    hasIsActive?: boolean;
  }) {
    try {
      return mapSociety(
        await this.societiesService.create({
          name: data.name,
          code: data.code,
          address: data.address || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          pincode: data.pincode || undefined,
          description: data.description || undefined,
          isActive: data.hasIsActive ? data.isActive : undefined,
        }),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('SocietyService', 'ListSocieties')
  @RequirePermissions('view:society')
  async listSocieties() {
    try {
      const societies = await this.societiesService.findAll();
      return { societies: societies.map(mapSociety) };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('SocietyService', 'GetSociety')
  @RequirePermissions('view:society')
  async getSociety(data: { uid: string }) {
    try {
      return mapSociety(await this.societiesService.findOne(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('SocietyService', 'UpdateSociety')
  @RequirePermissions('manage:society')
  async updateSociety(data: {
    uid: string;
    name?: string;
    code?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    description?: string;
    isActive?: boolean;
    hasName?: boolean;
    hasCode?: boolean;
    hasAddress?: boolean;
    hasCity?: boolean;
    hasState?: boolean;
    hasPincode?: boolean;
    hasDescription?: boolean;
    hasIsActive?: boolean;
    clearAddress?: boolean;
    clearCity?: boolean;
    clearState?: boolean;
    clearPincode?: boolean;
    clearDescription?: boolean;
  }) {
    try {
      return mapSociety(
        await this.societiesService.update(data.uid, {
          name: data.hasName ? data.name : undefined,
          code: data.hasCode ? data.code : undefined,
          address: data.clearAddress
            ? null
            : data.hasAddress
              ? data.address
              : undefined,
          city: data.clearCity ? null : data.hasCity ? data.city : undefined,
          state: data.clearState
            ? null
            : data.hasState
              ? data.state
              : undefined,
          pincode: data.clearPincode
            ? null
            : data.hasPincode
              ? data.pincode
              : undefined,
          description: data.clearDescription
            ? null
            : data.hasDescription
              ? data.description
              : undefined,
          isActive: data.hasIsActive ? data.isActive : undefined,
        }),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('SocietyService', 'DeleteSociety')
  @RequirePermissions('manage:society')
  async deleteSociety(data: { uid: string }) {
    try {
      return mapSociety(await this.societiesService.remove(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }
}

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BuildingGrpcController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @GrpcMethod('BuildingService', 'CreateBuilding')
  @RequirePermissions('manage:society')
  async createBuilding(data: {
    societyId: string;
    name: string;
    code: string;
    totalFloors?: number;
    description?: string;
    isActive?: boolean;
    hasTotalFloors?: boolean;
    hasIsActive?: boolean;
  }) {
    try {
      return mapBuilding(
        await this.buildingsService.create({
          societyId: data.societyId,
          name: data.name,
          code: data.code,
          totalFloors: data.hasTotalFloors ? data.totalFloors : undefined,
          description: data.description || undefined,
          isActive: data.hasIsActive ? data.isActive : undefined,
        }),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('BuildingService', 'ListBuildingsBySociety')
  @RequirePermissions('view:society')
  async listBuildingsBySociety(data: { uid: string }) {
    try {
      const buildings = await this.buildingsService.findBySociety(data.uid);
      return { buildings: buildings.map(mapBuilding) };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('BuildingService', 'GetBuilding')
  @RequirePermissions('view:society')
  async getBuilding(data: { uid: string }) {
    try {
      return mapBuilding(await this.buildingsService.findOne(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('BuildingService', 'UpdateBuilding')
  @RequirePermissions('manage:society')
  async updateBuilding(data: {
    uid: string;
    name?: string;
    code?: string;
    totalFloors?: number;
    description?: string;
    isActive?: boolean;
    hasName?: boolean;
    hasCode?: boolean;
    hasTotalFloors?: boolean;
    hasDescription?: boolean;
    hasIsActive?: boolean;
    clearTotalFloors?: boolean;
    clearDescription?: boolean;
  }) {
    try {
      return mapBuilding(
        await this.buildingsService.update(data.uid, {
          name: data.hasName ? data.name : undefined,
          code: data.hasCode ? data.code : undefined,
          totalFloors: data.clearTotalFloors
            ? null
            : data.hasTotalFloors
              ? data.totalFloors
              : undefined,
          description: data.clearDescription
            ? null
            : data.hasDescription
              ? data.description
              : undefined,
          isActive: data.hasIsActive ? data.isActive : undefined,
        }),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('BuildingService', 'DeleteBuilding')
  @RequirePermissions('manage:society')
  async deleteBuilding(data: { uid: string }) {
    try {
      return mapBuilding(await this.buildingsService.remove(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }
}

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FlatGrpcController {
  constructor(private readonly flatsService: FlatsService) {}

  @GrpcMethod('FlatService', 'CreateFlat')
  @RequirePermissions('manage:society')
  async createFlat(data: {
    buildingId: string;
    number: string;
    floor?: number;
    unitType?: string;
    areaSqFt?: number;
    description?: string;
    isActive?: boolean;
    hasFloor?: boolean;
    hasAreaSqFt?: boolean;
    hasIsActive?: boolean;
  }) {
    try {
      return mapFlat(
        await this.flatsService.create({
          buildingId: data.buildingId,
          number: data.number,
          floor: data.hasFloor ? data.floor : undefined,
          unitType: data.unitType || undefined,
          areaSqFt: data.hasAreaSqFt ? data.areaSqFt : undefined,
          description: data.description || undefined,
          isActive: data.hasIsActive ? data.isActive : undefined,
        }),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('FlatService', 'ListFlatsByBuilding')
  @RequirePermissions('view:society')
  async listFlatsByBuilding(data: { uid: string }) {
    try {
      const flats = await this.flatsService.findByBuilding(data.uid);
      return { flats: flats.map(mapFlat) };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('FlatService', 'GetFlat')
  @RequirePermissions('view:society')
  async getFlat(data: { uid: string }) {
    try {
      return mapFlat(await this.flatsService.findOne(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('FlatService', 'UpdateFlat')
  @RequirePermissions('manage:society')
  async updateFlat(data: {
    uid: string;
    number?: string;
    floor?: number;
    unitType?: string;
    areaSqFt?: number;
    description?: string;
    isActive?: boolean;
    hasNumber?: boolean;
    hasFloor?: boolean;
    hasUnitType?: boolean;
    hasAreaSqFt?: boolean;
    hasDescription?: boolean;
    hasIsActive?: boolean;
    clearFloor?: boolean;
    clearUnitType?: boolean;
    clearAreaSqFt?: boolean;
    clearDescription?: boolean;
  }) {
    try {
      return mapFlat(
        await this.flatsService.update(data.uid, {
          number: data.hasNumber ? data.number : undefined,
          floor: data.clearFloor
            ? null
            : data.hasFloor
              ? data.floor
              : undefined,
          unitType: data.clearUnitType
            ? null
            : data.hasUnitType
              ? data.unitType
              : undefined,
          areaSqFt: data.clearAreaSqFt
            ? null
            : data.hasAreaSqFt
              ? data.areaSqFt
              : undefined,
          description: data.clearDescription
            ? null
            : data.hasDescription
              ? data.description
              : undefined,
          isActive: data.hasIsActive ? data.isActive : undefined,
        }),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('FlatService', 'DeleteFlat')
  @RequirePermissions('manage:society')
  async deleteFlat(data: { uid: string }) {
    try {
      return mapFlat(await this.flatsService.remove(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }
}

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MembershipGrpcController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @GrpcMethod('MembershipService', 'CreateMembership')
  @RequirePermissions('manage:membership')
  async createMembership(data: {
    userId: string;
    societyId: string;
    flatId?: string;
    type: string;
    status?: string;
    isPrimary?: boolean;
    startedAt?: string;
    endedAt?: string;
    hasFlatId?: boolean;
    hasStatus?: boolean;
    hasIsPrimary?: boolean;
  }) {
    try {
      return mapMembership(
        await this.membershipsService.create({
          userId: data.userId,
          societyId: data.societyId,
          flatId: data.hasFlatId ? data.flatId : undefined,
          type: data.type as 'OWNER',
          status: data.hasStatus ? (data.status as 'ACTIVE') : undefined,
          isPrimary: data.hasIsPrimary ? data.isPrimary : undefined,
          startedAt: data.startedAt || undefined,
          endedAt: data.endedAt || undefined,
        }),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('MembershipService', 'ListMembershipsBySociety')
  @RequirePermissions('view:membership')
  async listMembershipsBySociety(data: { uid: string }) {
    try {
      const memberships = await this.membershipsService.findBySociety(data.uid);
      return { memberships: memberships.map(mapMembership) };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('MembershipService', 'ListMembershipsByUser')
  @RequirePermissions('view:membership')
  async listMembershipsByUser(data: { uid: string }) {
    try {
      const memberships = await this.membershipsService.findByUser(data.uid);
      return { memberships: memberships.map(mapMembership) };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('MembershipService', 'GetMembership')
  @RequirePermissions('view:membership')
  async getMembership(data: { uid: string }) {
    try {
      return mapMembership(await this.membershipsService.findOne(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('MembershipService', 'UpdateMembership')
  @RequirePermissions('manage:membership')
  async updateMembership(data: {
    uid: string;
    flatId?: string;
    type?: string;
    status?: string;
    isPrimary?: boolean;
    startedAt?: string;
    endedAt?: string;
    hasFlatId?: boolean;
    clearFlatId?: boolean;
    hasType?: boolean;
    hasStatus?: boolean;
    hasIsPrimary?: boolean;
    hasStartedAt?: boolean;
    clearStartedAt?: boolean;
    hasEndedAt?: boolean;
    clearEndedAt?: boolean;
  }) {
    try {
      return mapMembership(
        await this.membershipsService.update(data.uid, {
          flatId: data.clearFlatId
            ? null
            : data.hasFlatId
              ? data.flatId
              : undefined,
          type: data.hasType ? (data.type as 'OWNER') : undefined,
          status: data.hasStatus ? (data.status as 'ACTIVE') : undefined,
          isPrimary: data.hasIsPrimary ? data.isPrimary : undefined,
          startedAt: data.clearStartedAt
            ? null
            : data.hasStartedAt
              ? data.startedAt
              : undefined,
          endedAt: data.clearEndedAt
            ? null
            : data.hasEndedAt
              ? data.endedAt
              : undefined,
        }),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('MembershipService', 'DeleteMembership')
  @RequirePermissions('manage:membership')
  async deleteMembership(data: { uid: string }) {
    try {
      return mapMembership(await this.membershipsService.remove(data.uid));
    } catch (error) {
      throw toRpcException(error);
    }
  }
}
