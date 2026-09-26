import { User } from './entities/user.entity.js';

export type UserResponse = Omit<User, 'passwordHash' | 'userRoles'> & {
  roles?: Array<{ uid: string; name: string; description: string | null }>;
  permissions?: string[];
};

export function toUserResponse(
  user: User,
  options?: { permissions?: string[] },
): UserResponse {
  const { passwordHash: _passwordHash, userRoles, ...rest } = user;
  return {
    ...rest,
    roles: userRoles?.map((ur) => ({
      uid: ur.role.uid,
      name: ur.role.name,
      description: ur.role.description,
    })),
    permissions: options?.permissions,
  };
}
