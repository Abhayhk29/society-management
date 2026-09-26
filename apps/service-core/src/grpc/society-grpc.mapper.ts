import {
  BuildingResponse,
  FlatResponse,
  MembershipResponse,
  SocietyResponse,
} from '../society/society.mapper.js';
import { dateToString } from './grpc-exception.util.js';

export function mapSociety(society: SocietyResponse) {
  return {
    uid: society.uid,
    name: society.name,
    code: society.code,
    address: society.address ?? '',
    city: society.city ?? '',
    state: society.state ?? '',
    pincode: society.pincode ?? '',
    description: society.description ?? '',
    isActive: society.isActive,
    createdAt: dateToString(society.createdAt),
    updatedAt: dateToString(society.updatedAt),
  };
}

export function mapBuilding(building: BuildingResponse) {
  return {
    uid: building.uid,
    societyId: building.societyId,
    name: building.name,
    code: building.code,
    totalFloors: building.totalFloors ?? 0,
    hasTotalFloors: building.totalFloors !== null,
    description: building.description ?? '',
    isActive: building.isActive,
    createdAt: dateToString(building.createdAt),
    updatedAt: dateToString(building.updatedAt),
  };
}

export function mapFlat(flat: FlatResponse) {
  return {
    uid: flat.uid,
    buildingId: flat.buildingId,
    societyId: flat.societyId ?? '',
    number: flat.number,
    floor: flat.floor ?? 0,
    hasFloor: flat.floor !== null,
    unitType: flat.unitType ?? '',
    areaSqFt: flat.areaSqFt ?? 0,
    hasAreaSqFt: flat.areaSqFt !== null,
    description: flat.description ?? '',
    isActive: flat.isActive,
    createdAt: dateToString(flat.createdAt),
    updatedAt: dateToString(flat.updatedAt),
  };
}

export function mapMembership(membership: MembershipResponse) {
  return {
    uid: membership.uid,
    userId: membership.userId,
    societyId: membership.societyId,
    flatId: membership.flatId ?? '',
    hasFlatId: membership.flatId !== null,
    type: membership.type,
    status: membership.status,
    isPrimary: membership.isPrimary,
    startedAt: dateToString(membership.startedAt),
    endedAt: dateToString(membership.endedAt),
    createdAt: dateToString(membership.createdAt),
    updatedAt: dateToString(membership.updatedAt),
    userEmail: membership.userEmail ?? '',
    userName: membership.userName ?? '',
    flatNumber: membership.flatNumber ?? '',
  };
}
