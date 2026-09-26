import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { Permission } from './entities/permission.entity.js';
import { Role } from './entities/role.entity.js';
import { RolePermission } from './entities/role-permission.entity.js';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionsRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionsRepo: Repository<RolePermission>,
  ) {}

  async create(dto: CreateRoleDto) {
    await this.ensureNameAvailable(dto.name);
    const role = await this.rolesRepo.save(
      this.rolesRepo.create({
        name: dto.name.toUpperCase(),
        description: dto.description ?? null,
      }),
    );
    return role;
  }

  findAll() {
    return this.rolesRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(uid: string) {
    const role = await this.rolesRepo.findOne({
      where: { uid },
      relations: { rolePermissions: { permission: true } },
    });
    if (!role) {
      throw new NotFoundException(`Role ${uid} not found`);
    }
    return {
      uid: role.uid,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      permissions: role.rolePermissions?.map((rp) => ({
        uid: rp.permission.uid,
        action: rp.permission.action,
        module: rp.permission.module,
        description: rp.permission.description,
      })),
    };
  }

  async update(uid: string, dto: UpdateRoleDto) {
    const role = await this.rolesRepo.findOne({ where: { uid } });
    if (!role) {
      throw new NotFoundException(`Role ${uid} not found`);
    }
    if (dto.name && dto.name.toUpperCase() !== role.name) {
      await this.ensureNameAvailable(dto.name, uid);
      role.name = dto.name.toUpperCase();
    }
    if (dto.description !== undefined) {
      role.description = dto.description;
    }
    await this.rolesRepo.save(role);
    return this.findOne(uid);
  }

  async remove(uid: string) {
    const role = await this.rolesRepo.findOne({ where: { uid } });
    if (!role) {
      throw new NotFoundException(`Role ${uid} not found`);
    }
    await this.rolesRepo.remove(role);
    return { removed: true, uid };
  }

  async listPermissions(uid: string) {
    await this.findOne(uid);
    const assignments = await this.rolePermissionsRepo.find({
      where: { role: { uid } },
      relations: { permission: true },
      order: { assignedAt: 'DESC' },
    });
    return assignments.map((a) => ({
      uid: a.uid,
      assignedAt: a.assignedAt,
      permission: {
        uid: a.permission.uid,
        action: a.permission.action,
        module: a.permission.module,
        description: a.permission.description,
      },
    }));
  }

  async assignPermission(uid: string, permissionId: string) {
    const role = await this.rolesRepo.findOne({ where: { uid } });
    if (!role) {
      throw new NotFoundException(`Role ${uid} not found`);
    }
    const permission = await this.permissionsRepo.findOne({
      where: { uid: permissionId },
    });
    if (!permission) {
      throw new NotFoundException(`Permission ${permissionId} not found`);
    }

    const existing = await this.rolePermissionsRepo.findOne({
      where: { role: { uid }, permission: { uid: permissionId } },
    });
    if (existing) {
      throw new ConflictException('Permission already assigned to role');
    }

    const assignment = await this.rolePermissionsRepo.save(
      this.rolePermissionsRepo.create({ role, permission }),
    );
    return {
      uid: assignment.uid,
      assignedAt: assignment.assignedAt,
      roleId: uid,
      permissionId,
    };
  }

  async removePermission(uid: string, permissionId: string) {
    const assignment = await this.rolePermissionsRepo.findOne({
      where: { role: { uid }, permission: { uid: permissionId } },
    });
    if (!assignment) {
      throw new NotFoundException('Permission assignment not found');
    }
    await this.rolePermissionsRepo.remove(assignment);
    return { removed: true, roleId: uid, permissionId };
  }

  private async ensureNameAvailable(name: string, excludeUid?: string) {
    const existing = await this.rolesRepo.findOne({
      where: { name: name.toUpperCase() },
    });
    if (existing && existing.uid !== excludeUid) {
      throw new ConflictException('Role name already exists');
    }
  }
}
