import { Building } from './entities/building.entity.js';
import { Flat } from './entities/flat.entity.js';
import { Membership } from './entities/membership.entity.js';
import { Society } from './entities/society.entity.js';

export type SocietyResponse = {
  uid: string;
  name: string;
  code: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type BuildingResponse = {
  uid: string;
  societyId: string;
  name: string;
  code: string;
  totalFloors: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type FlatResponse = {
  uid: string;
  buildingId: string;
  societyId?: string;
  number: string;
  floor: number | null;
  unitType: string | null;
  areaSqFt: number | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type MembershipResponse = {
  uid: string;
  userId: string;
  societyId: string;
  flatId: string | null;
  type: string;
  status: string;
  isPrimary: boolean;
  startedAt: Date | null;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  userEmail?: string;
  userName?: string;
  flatNumber?: string;
};

export function toSocietyResponse(society: Society): SocietyResponse {
  return {
    uid: society.uid,
    name: society.name,
    code: society.code,
    address: society.address,
    city: society.city,
    state: society.state,
    pincode: society.pincode,
    description: society.description,
    isActive: society.isActive,
    createdAt: society.createdAt,
    updatedAt: society.updatedAt,
  };
}

export function toBuildingResponse(building: Building): BuildingResponse {
  return {
    uid: building.uid,
    societyId: building.societyId ?? building.society?.uid,
    name: building.name,
    code: building.code,
    totalFloors: building.totalFloors,
    description: building.description,
    isActive: building.isActive,
    createdAt: building.createdAt,
    updatedAt: building.updatedAt,
  };
}

export function toFlatResponse(flat: Flat): FlatResponse {
  return {
    uid: flat.uid,
    buildingId: flat.buildingId ?? flat.building?.uid,
    societyId: flat.building?.societyId ?? flat.building?.society?.uid,
    number: flat.number,
    floor: flat.floor,
    unitType: flat.unitType,
    areaSqFt: flat.areaSqFt,
    description: flat.description,
    isActive: flat.isActive,
    createdAt: flat.createdAt,
    updatedAt: flat.updatedAt,
  };
}

export function toMembershipResponse(
  membership: Membership,
): MembershipResponse {
  const user = membership.user;
  return {
    uid: membership.uid,
    userId: membership.userId ?? user?.uid,
    societyId: membership.societyId ?? membership.society?.uid,
    flatId: membership.flatId ?? membership.flat?.uid ?? null,
    type: membership.type,
    status: membership.status,
    isPrimary: membership.isPrimary,
    startedAt: membership.startedAt,
    endedAt: membership.endedAt,
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt,
    userEmail: user?.email,
    userName: user ? `${user.firstName} ${user.lastName}`.trim() : undefined,
    flatNumber: membership.flat?.number,
  };
}
