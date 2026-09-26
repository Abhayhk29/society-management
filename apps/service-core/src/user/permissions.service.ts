import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePermissionDto } from './dto/create-permission.dto.js';
import { UpdatePermissionDto } from './dto/update-permission.dto.js';
import { Permission } from './entities/permission.entity.js';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepo: Repository<Permission>,
  ) {}

  async create(dto: CreatePermissionDto) {
    await this.ensureActionAvailable(dto.action);
    return this.permissionsRepo.save(
      this.permissionsRepo.create({
        action: dto.action,
        module: dto.module,
        description: dto.description ?? null,
      }),
    );
  }

  findAll() {
    return this.permissionsRepo.find({
      order: { module: 'ASC', action: 'ASC' },
    });
  }

  async findOne(uid: string) {
    const permission = await this.permissionsRepo.findOne({ where: { uid } });
    if (!permission) {
      throw new NotFoundException(`Permission ${uid} not found`);
    }
    return permission;
  }

  async update(uid: string, dto: UpdatePermissionDto) {
    const permission = await this.findOne(uid);
    if (dto.action && dto.action !== permission.action) {
      await this.ensureActionAvailable(dto.action, uid);
      permission.action = dto.action;
    }
    if (dto.module !== undefined) permission.module = dto.module;
    if (dto.description !== undefined) {
      permission.description = dto.description;
    }
    return this.permissionsRepo.save(permission);
  }

  async remove(uid: string) {
    const permission = await this.findOne(uid);
    await this.permissionsRepo.remove(permission);
    return { removed: true, uid };
  }

  private async ensureActionAvailable(action: string, excludeUid?: string) {
    const existing = await this.permissionsRepo.findOne({ where: { action } });
    if (existing && existing.uid !== excludeUid) {
      throw new ConflictException('Permission action already exists');
    }
  }
}
