import { UserResponse as ServiceUser } from '../user/users.mapper.js';
import { dateToString } from './grpc-exception.util.js';

export function mapUser(user: ServiceUser) {
  return {
    uid: user.uid,
    email: user.email,
    phoneNumber: user.phoneNumber ?? '',
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    lastLogin: dateToString(user.lastLogin),
    createdAt: dateToString(user.createdAt),
    updatedAt: dateToString(user.updatedAt),
    roles: (user.roles ?? []).map((role) => ({
      uid: role.uid,
      name: role.name,
      description: role.description ?? '',
    })),
    permissions: user.permissions ?? [],
  };
}

export function mapPermission(permission: {
  uid: string;
  action: string;
  module: string;
  description: string | null;
}) {
  return {
    uid: permission.uid,
    action: permission.action,
    module: permission.module,
    description: permission.description ?? '',
  };
}

export function mapRole(role: {
  uid: string;
  name: string;
  description: string | null;
  createdAt: Date;
}) {
  return {
    uid: role.uid,
    name: role.name,
    description: role.description ?? '',
    createdAt: dateToString(role.createdAt),
  };
}
