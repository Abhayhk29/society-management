import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity.js';
import { Role } from './entities/role.entity.js';
import { RolePermission } from './entities/role-permission.entity.js';
import { User } from './entities/user.entity.js';
import { UserRole } from './entities/user-role.entity.js';

const DEFAULT_ROLES: Array<{ name: string; description: string }> = [
  { name: 'ADMIN', description: 'Full society administration access' },
  { name: 'RESIDENT', description: 'Society resident / flat owner' },
  { name: 'GUARD', description: 'Gate guard / security staff' },
  { name: 'VENDOR', description: 'External vendor / service provider' },
];

const DEFAULT_PERMISSIONS: Array<{
  action: string;
  module: string;
  description: string;
}> = [
  { action: 'create:user', module: 'UserManagement', description: 'Create users' },
  { action: 'view:user', module: 'UserManagement', description: 'View users' },
  { action: 'update:user', module: 'UserManagement', description: 'Update users' },
  { action: 'delete:user', module: 'UserManagement', description: 'Deactivate users' },
  { action: 'manage:roles', module: 'UserManagement', description: 'Manage roles and assignments' },
  { action: 'manage:permissions', module: 'UserManagement', description: 'Manage permissions' },
  { action: 'approve:gate_pass', module: 'GateManagement', description: 'Approve gate passes' },
  { action: 'view:gate_pass', module: 'GateManagement', description: 'View gate passes' },
  { action: 'create:gate_pass', module: 'GateManagement', description: 'Create gate passes' },
  { action: 'view:bills', module: 'Billing', description: 'View bills' },
  { action: 'create:bills', module: 'Billing', description: 'Create bills' },
  { action: 'pay:bills', module: 'Billing', description: 'Pay bills' },
];

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  ADMIN: [
    'create:user',
    'view:user',
    'update:user',
    'delete:user',
    'manage:roles',
    'manage:permissions',
    'approve:gate_pass',
    'view:gate_pass',
    'create:gate_pass',
    'view:bills',
    'create:bills',
    'pay:bills',
  ],
  RESIDENT: [
    'view:user',
    'view:gate_pass',
    'create:gate_pass',
    'view:bills',
    'pay:bills',
  ],
  GUARD: ['approve:gate_pass', 'view:gate_pass', 'create:gate_pass', 'view:user'],
  VENDOR: ['view:gate_pass', 'create:gate_pass'],
};

@Injectable()
export class RbacSeedService implements OnModuleInit {
  private readonly logger = new Logger(RbacSeedService.name);

  constructor(
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionsRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionsRepo: Repository<RolePermission>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>,
  ) {}

  async onModuleInit() {
    if (process.env.RBAC_SEED === 'false') {
      this.logger.log('RBAC seed skipped (RBAC_SEED=false)');
      return;
    }
    await this.seed();
  }

  async seed() {
    const roles = new Map<string, Role>();
    for (const item of DEFAULT_ROLES) {
      let role = await this.rolesRepo.findOne({ where: { name: item.name } });
      if (!role) {
        role = await this.rolesRepo.save(this.rolesRepo.create(item));
        this.logger.log(`Seeded role ${item.name}`);
      }
      roles.set(item.name, role);
    }

    const permissions = new Map<string, Permission>();
    for (const item of DEFAULT_PERMISSIONS) {
      let permission = await this.permissionsRepo.findOne({
        where: { action: item.action },
      });
      if (!permission) {
        permission = await this.permissionsRepo.save(
          this.permissionsRepo.create(item),
        );
        this.logger.log(`Seeded permission ${item.action}`);
      }
      permissions.set(item.action, permission);
    }

    for (const [roleName, actions] of Object.entries(ROLE_PERMISSION_MAP)) {
      const role = roles.get(roleName);
      if (!role) continue;
      for (const action of actions) {
        const permission = permissions.get(action);
        if (!permission) continue;
        const existing = await this.rolePermissionsRepo.findOne({
          where: {
            role: { uid: role.uid },
            permission: { uid: permission.uid },
          },
        });
        if (!existing) {
          await this.rolePermissionsRepo.save(
            this.rolePermissionsRepo.create({ role, permission }),
          );
        }
      }
    }

    await this.seedAdminUser(roles.get('ADMIN'));
    this.logger.log('RBAC seed complete');
  }

  private async seedAdminUser(adminRole?: Role) {
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password || !adminRole) {
      return;
    }

    let user = await this.usersRepo.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user) {
      user = await this.usersRepo.save(
        this.usersRepo.create({
          email: email.toLowerCase(),
          passwordHash: await bcrypt.hash(password, 10),
          firstName: process.env.SEED_ADMIN_FIRST_NAME ?? 'System',
          lastName: process.env.SEED_ADMIN_LAST_NAME ?? 'Admin',
          phoneNumber: null,
          isActive: true,
        }),
      );
      this.logger.log(`Seeded admin user ${email}`);
    }

    const existing = await this.userRolesRepo.findOne({
      where: { user: { uid: user.uid }, role: { uid: adminRole.uid } },
    });
    if (!existing) {
      await this.userRolesRepo.save(
        this.userRolesRepo.create({ user, role: adminRole }),
      );
      this.logger.log(`Assigned ADMIN role to ${email}`);
    }
  }
}
