import { Metadata } from '@grpc/grpc-js';
import { Inject, Injectable, OnModuleInit, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { ClientGrpc } from '@nestjs/microservices';
import type { Request } from 'express';
import { firstValueFrom, Observable } from 'rxjs';
import {
  AUTH_SERVICE,
  PERMISSION_SERVICE,
  ROLE_SERVICE,
  USER_SERVICE,
} from 'shared-protos';
import { CORE_GRPC } from '../grpc/grpc-clients.module.js';
import { mapGrpcError } from '../grpc/grpc-error.util.js';

type GrpcUnary<TReq, TRes> = (
  data: TReq,
  metadata?: Metadata,
) => Observable<TRes>;

interface AuthServiceClient {
  register: GrpcUnary<unknown, unknown>;
  login: GrpcUnary<unknown, unknown>;
  me: GrpcUnary<{ accessToken: string }, unknown>;
  refresh: GrpcUnary<{ refreshToken: string }, unknown>;
  logout: GrpcUnary<{ refreshToken: string }, unknown>;
  logoutAll: GrpcUnary<{ accessToken: string }, unknown>;
  forgotPassword: GrpcUnary<{ email: string }, unknown>;
  resetPassword: GrpcUnary<{ token: string; newPassword: string }, unknown>;
  sendOtp: GrpcUnary<
    { phoneNumber: string; purpose: string; accessToken?: string },
    unknown
  >;
  verifyOtp: GrpcUnary<
    {
      phoneNumber: string;
      purpose: string;
      code: string;
      newPassword?: string;
      accessToken?: string;
    },
    unknown
  >;
}

interface UserServiceClient {
  createUser: GrpcUnary<unknown, unknown>;
  listUsers: GrpcUnary<unknown, { users: unknown[] }>;
  getUser: GrpcUnary<{ uid: string }, unknown>;
  updateUser: GrpcUnary<unknown, unknown>;
  deleteUser: GrpcUnary<{ uid: string }, unknown>;
  listUserRoles: GrpcUnary<{ uid: string }, unknown>;
  assignRole: GrpcUnary<{ userId: string; roleId: string }, unknown>;
  removeRole: GrpcUnary<{ userId: string; roleId: string }, unknown>;
}

interface RoleServiceClient {
  createRole: GrpcUnary<unknown, unknown>;
  listRoles: GrpcUnary<unknown, { roles: unknown[] }>;
  getRole: GrpcUnary<{ uid: string }, unknown>;
  updateRole: GrpcUnary<unknown, unknown>;
  deleteRole: GrpcUnary<{ uid: string }, unknown>;
  listRolePermissions: GrpcUnary<{ uid: string }, unknown>;
  assignPermission: GrpcUnary<
    { roleId: string; permissionId: string },
    unknown
  >;
  removePermission: GrpcUnary<
    { roleId: string; permissionId: string },
    unknown
  >;
}

interface PermissionServiceClient {
  createPermission: GrpcUnary<unknown, unknown>;
  listPermissions: GrpcUnary<unknown, { permissions: unknown[] }>;
  getPermission: GrpcUnary<{ uid: string }, unknown>;
  updatePermission: GrpcUnary<unknown, unknown>;
  deletePermission: GrpcUnary<{ uid: string }, unknown>;
}

@Injectable({ scope: Scope.REQUEST })
export class CoreRbacService implements OnModuleInit {
  private auth!: AuthServiceClient;
  private users!: UserServiceClient;
  private roles!: RoleServiceClient;
  private permissions!: PermissionServiceClient;

  constructor(
    @Inject(CORE_GRPC) private readonly coreClient: ClientGrpc,
    @Inject(REQUEST) private readonly request: Request,
  ) {}

  onModuleInit() {
    this.auth = this.coreClient.getService<AuthServiceClient>(AUTH_SERVICE);
    this.users = this.coreClient.getService<UserServiceClient>(USER_SERVICE);
    this.roles = this.coreClient.getService<RoleServiceClient>(ROLE_SERVICE);
    this.permissions =
      this.coreClient.getService<PermissionServiceClient>(PERMISSION_SERVICE);
  }

  private authMetadata(includeAuth = true): Metadata {
    const metadata = new Metadata();
    if (includeAuth) {
      const header = this.request.headers?.authorization;
      if (header) {
        metadata.set('authorization', String(header));
      }
    }
    return metadata;
  }

  private async call<T>(
    fn: (metadata: Metadata) => Observable<T>,
    includeAuth = true,
  ): Promise<T> {
    try {
      return await firstValueFrom(fn(this.authMetadata(includeAuth)));
    } catch (error) {
      mapGrpcError(error);
    }
  }

  register(body: Record<string, unknown>) {
    return this.call(
      (metadata) =>
        this.auth.register(
          {
            email: body.email,
            phoneNumber: body.phoneNumber ?? '',
            password: body.password,
            firstName: body.firstName,
            lastName: body.lastName,
          },
          metadata,
        ),
      false,
    );
  }

  login(body: Record<string, unknown>) {
    return this.call(
      (metadata) =>
        this.auth.login(
          {
            email: body.email,
            password: body.password,
          },
          metadata,
        ),
      false,
    );
  }

  me(accessToken: string) {
    return this.call(
      (metadata) => this.auth.me({ accessToken }, metadata),
      false,
    );
  }

  refresh(refreshToken: string) {
    return this.call(
      (metadata) => this.auth.refresh({ refreshToken }, metadata),
      false,
    );
  }

  logout(refreshToken: string) {
    return this.call(
      (metadata) => this.auth.logout({ refreshToken }, metadata),
      false,
    );
  }

  logoutAll(accessToken: string) {
    return this.call(
      (metadata) => this.auth.logoutAll({ accessToken }, metadata),
      false,
    );
  }

  forgotPassword(email: string) {
    return this.call(
      (metadata) => this.auth.forgotPassword({ email }, metadata),
      false,
    );
  }

  resetPassword(token: string, newPassword: string) {
    return this.call(
      (metadata) => this.auth.resetPassword({ token, newPassword }, metadata),
      false,
    );
  }

  sendOtp(phoneNumber: string, purpose: string, accessToken?: string) {
    return this.call(
      (metadata) =>
        this.auth.sendOtp(
          { phoneNumber, purpose, accessToken: accessToken ?? '' },
          metadata,
        ),
      false,
    );
  }

  async verifyOtp(body: {
    phoneNumber: string;
    purpose: string;
    code: string;
    newPassword?: string;
    accessToken?: string;
  }) {
    const res = (await this.call(
      (metadata) =>
        this.auth.verifyOtp(
          {
            phoneNumber: body.phoneNumber,
            purpose: body.purpose,
            code: body.code,
            newPassword: body.newPassword ?? '',
            accessToken: body.accessToken ?? '',
          },
          metadata,
        ),
      false,
    )) as {
      verified: boolean;
      message: string;
      hasAuth?: boolean;
      auth?: unknown;
    };

    if (res.hasAuth && res.auth) {
      return res.auth;
    }
    return { verified: res.verified, message: res.message };
  }

  createUser(body: Record<string, unknown>) {
    return this.call((metadata) =>
      this.users.createUser(
        {
          email: body.email,
          phoneNumber: body.phoneNumber ?? '',
          password: body.password,
          firstName: body.firstName,
          lastName: body.lastName,
          isActive: body.isActive ?? true,
          hasIsActive: body.isActive !== undefined,
        },
        metadata,
      ),
    );
  }

  async listUsers() {
    const res = await this.call((metadata) =>
      this.users.listUsers({}, metadata),
    );
    return res.users ?? [];
  }

  getUser(uid: string) {
    return this.call((metadata) => this.users.getUser({ uid }, metadata));
  }

  updateUser(uid: string, body: Record<string, unknown>) {
    return this.call((metadata) =>
      this.users.updateUser(
        {
          uid,
          email: body.email ?? '',
          phoneNumber: body.phoneNumber ?? '',
          password: body.password ?? '',
          firstName: body.firstName ?? '',
          lastName: body.lastName ?? '',
          isActive: body.isActive ?? false,
          hasEmail: body.email !== undefined,
          hasPhoneNumber:
            body.phoneNumber !== undefined && body.phoneNumber !== null,
          hasPassword: body.password !== undefined,
          hasFirstName: body.firstName !== undefined,
          hasLastName: body.lastName !== undefined,
          hasIsActive: body.isActive !== undefined,
          clearPhoneNumber: body.phoneNumber === null,
        },
        metadata,
      ),
    );
  }

  deleteUser(uid: string) {
    return this.call((metadata) => this.users.deleteUser({ uid }, metadata));
  }

  listUserRoles(uid: string) {
    return this.call((metadata) => this.users.listUserRoles({ uid }, metadata));
  }

  assignRole(uid: string, roleId: string) {
    return this.call((metadata) =>
      this.users.assignRole({ userId: uid, roleId }, metadata),
    );
  }

  removeRole(uid: string, roleId: string) {
    return this.call((metadata) =>
      this.users.removeRole({ userId: uid, roleId }, metadata),
    );
  }

  createRole(body: Record<string, unknown>) {
    return this.call((metadata) =>
      this.roles.createRole(
        {
          name: body.name,
          description: body.description ?? '',
        },
        metadata,
      ),
    );
  }

  async listRoles() {
    const res = await this.call((metadata) =>
      this.roles.listRoles({}, metadata),
    );
    return res.roles ?? [];
  }

  getRole(uid: string) {
    return this.call((metadata) => this.roles.getRole({ uid }, metadata));
  }

  updateRole(uid: string, body: Record<string, unknown>) {
    return this.call((metadata) =>
      this.roles.updateRole(
        {
          uid,
          name: body.name ?? '',
          description: body.description ?? '',
          hasName: body.name !== undefined,
          hasDescription:
            body.description !== undefined && body.description !== null,
          clearDescription: body.description === null,
        },
        metadata,
      ),
    );
  }

  deleteRole(uid: string) {
    return this.call((metadata) => this.roles.deleteRole({ uid }, metadata));
  }

  listRolePermissions(uid: string) {
    return this.call((metadata) =>
      this.roles.listRolePermissions({ uid }, metadata),
    );
  }

  assignPermission(uid: string, permissionId: string) {
    return this.call((metadata) =>
      this.roles.assignPermission({ roleId: uid, permissionId }, metadata),
    );
  }

  removePermission(uid: string, permissionId: string) {
    return this.call((metadata) =>
      this.roles.removePermission({ roleId: uid, permissionId }, metadata),
    );
  }

  createPermission(body: Record<string, unknown>) {
    return this.call((metadata) =>
      this.permissions.createPermission(
        {
          action: body.action,
          module: body.module,
          description: body.description ?? '',
        },
        metadata,
      ),
    );
  }

  async listPermissions() {
    const res = await this.call((metadata) =>
      this.permissions.listPermissions({}, metadata),
    );
    return res.permissions ?? [];
  }

  getPermission(uid: string) {
    return this.call((metadata) =>
      this.permissions.getPermission({ uid }, metadata),
    );
  }

  updatePermission(uid: string, body: Record<string, unknown>) {
    return this.call((metadata) =>
      this.permissions.updatePermission(
        {
          uid,
          action: body.action ?? '',
          module: body.module ?? '',
          description: body.description ?? '',
          hasAction: body.action !== undefined,
          hasModule: body.module !== undefined,
          hasDescription:
            body.description !== undefined && body.description !== null,
          clearDescription: body.description === null,
        },
        metadata,
      ),
    );
  }

  deletePermission(uid: string) {
    return this.call((metadata) =>
      this.permissions.deletePermission({ uid }, metadata),
    );
  }
}
