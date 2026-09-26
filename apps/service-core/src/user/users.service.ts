import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { Role } from './entities/role.entity.js';
import { User } from './entities/user.entity.js';
import { UserRole } from './entities/user-role.entity.js';
import { toUserResponse, UserResponse } from './users.mapper.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRolesRepo: Repository<UserRole>,
  ) {}

  async create(dto: CreateUserDto): Promise<UserResponse> {
    await this.ensureEmailAvailable(dto.email);
    if (dto.phoneNumber) {
      await this.ensurePhoneAvailable(dto.phoneNumber);
    }

    const user = this.usersRepo.create({
      email: dto.email.toLowerCase(),
      phoneNumber: dto.phoneNumber ?? null,
      passwordHash: await bcrypt.hash(dto.password, 10),
      firstName: dto.firstName,
      lastName: dto.lastName,
      isActive: dto.isActive ?? true,
    });

    const saved = await this.usersRepo.save(user);
    return toUserResponse(saved);
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await this.usersRepo.find({
      relations: { userRoles: { role: true } },
      order: { createdAt: 'DESC' },
    });
    return users.map((user) => toUserResponse(user));
  }

  async findOne(uid: string): Promise<UserResponse> {
    const user = await this.usersRepo.findOne({
      where: { uid },
      relations: { userRoles: { role: true } },
    });
    if (!user) {
      throw new NotFoundException(`User ${uid} not found`);
    }
    return toUserResponse(user);
  }

  async update(uid: string, dto: UpdateUserDto): Promise<UserResponse> {
    const user = await this.usersRepo.findOne({ where: { uid } });
    if (!user) {
      throw new NotFoundException(`User ${uid} not found`);
    }

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      await this.ensureEmailAvailable(dto.email, uid);
      user.email = dto.email.toLowerCase();
    }
    if (dto.phoneNumber !== undefined) {
      if (dto.phoneNumber && dto.phoneNumber !== user.phoneNumber) {
        await this.ensurePhoneAvailable(dto.phoneNumber, uid);
      }
      user.phoneNumber = dto.phoneNumber;
    }
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const saved = await this.usersRepo.save(user);
    return this.findOne(saved.uid);
  }

  async remove(uid: string): Promise<UserResponse> {
    return this.update(uid, { isActive: false });
  }

  async listRoles(uid: string) {
    await this.findOne(uid);
    const assignments = await this.userRolesRepo.find({
      where: { user: { uid } },
      relations: { role: true },
      order: { assignedAt: 'DESC' },
    });
    return assignments.map((a) => ({
      uid: a.uid,
      assignedAt: a.assignedAt,
      role: {
        uid: a.role.uid,
        name: a.role.name,
        description: a.role.description,
      },
    }));
  }

  async assignRole(uid: string, roleId: string) {
    const user = await this.usersRepo.findOne({ where: { uid } });
    if (!user) {
      throw new NotFoundException(`User ${uid} not found`);
    }
    const role = await this.rolesRepo.findOne({ where: { uid: roleId } });
    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    const existing = await this.userRolesRepo.findOne({
      where: { user: { uid }, role: { uid: roleId } },
    });
    if (existing) {
      throw new ConflictException('Role already assigned to user');
    }

    const assignment = await this.userRolesRepo.save(
      this.userRolesRepo.create({ user, role }),
    );
    return {
      uid: assignment.uid,
      assignedAt: assignment.assignedAt,
      userId: uid,
      roleId,
    };
  }

  async removeRole(uid: string, roleId: string) {
    const assignment = await this.userRolesRepo.findOne({
      where: { user: { uid }, role: { uid: roleId } },
    });
    if (!assignment) {
      throw new NotFoundException('Role assignment not found');
    }
    await this.userRolesRepo.remove(assignment);
    return { removed: true, userId: uid, roleId };
  }

  private async ensureEmailAvailable(email: string, excludeUid?: string) {
    const existing = await this.usersRepo.findOne({
      where: { email: email.toLowerCase() },
    });
    if (existing && existing.uid !== excludeUid) {
      throw new ConflictException('Email already in use');
    }
  }

  private async ensurePhoneAvailable(phone: string, excludeUid?: string) {
    const existing = await this.usersRepo.findOne({
      where: { phoneNumber: phone },
    });
    if (existing && existing.uid !== excludeUid) {
      throw new ConflictException('Phone number already in use');
    }
  }
}
