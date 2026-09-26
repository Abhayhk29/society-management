import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from '../user/entities/user.entity.js';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
} from './dto/membership.dto.js';
import { Membership } from './entities/membership.entity.js';
import { FlatsService } from './flats.service.js';
import { SocietiesService } from './societies.service.js';
import { MembershipResponse, toMembershipResponse } from './society.mapper.js';

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipsRepo: Repository<Membership>,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    private readonly societiesService: SocietiesService,
    private readonly flatsService: FlatsService,
  ) {}

  async create(dto: CreateMembershipDto): Promise<MembershipResponse> {
    const society = await this.societiesService.getEntity(dto.societyId);
    const user = await this.usersRepo.findOne({ where: { uid: dto.userId } });
    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }

    let flat = null;
    if (dto.flatId) {
      flat = await this.flatsService.getEntity(dto.flatId);
      const flatSocietyId =
        flat.building?.societyId ?? flat.building?.society?.uid;
      if (flatSocietyId !== society.uid) {
        throw new BadRequestException(
          'Flat does not belong to the given society',
        );
      }
      await this.ensureNoDuplicateFlatMembership(user.uid, flat.uid);
    } else {
      await this.ensureNoDuplicateSocietyMembership(
        user.uid,
        society.uid,
        dto.type,
      );
    }

    if (dto.isPrimary) {
      await this.clearPrimary(user.uid, society.uid);
    }

    const saved = await this.membershipsRepo.save(
      this.membershipsRepo.create({
        user,
        society,
        flat,
        type: dto.type,
        status: dto.status ?? 'ACTIVE',
        isPrimary: dto.isPrimary ?? false,
        startedAt: dto.startedAt ? new Date(dto.startedAt) : new Date(),
        endedAt: dto.endedAt ? new Date(dto.endedAt) : null,
      }),
    );

    return this.findOne(saved.uid);
  }

  async findBySociety(societyId: string): Promise<MembershipResponse[]> {
    await this.societiesService.getEntity(societyId);
    const rows = await this.membershipsRepo.find({
      where: { society: { uid: societyId } },
      relations: { user: true, society: true, flat: true },
      order: { createdAt: 'DESC' },
    });
    return rows.map(toMembershipResponse);
  }

  async findByUser(userId: string): Promise<MembershipResponse[]> {
    const user = await this.usersRepo.findOne({ where: { uid: userId } });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }
    const rows = await this.membershipsRepo.find({
      where: { user: { uid: userId } },
      relations: { user: true, society: true, flat: true },
      order: { createdAt: 'DESC' },
    });
    return rows.map(toMembershipResponse);
  }

  async findOne(uid: string): Promise<MembershipResponse> {
    return toMembershipResponse(await this.getEntity(uid));
  }

  async update(
    uid: string,
    dto: UpdateMembershipDto,
  ): Promise<MembershipResponse> {
    const membership = await this.getEntity(uid);

    if (dto.flatId !== undefined) {
      if (dto.flatId === null) {
        membership.flat = null;
      } else {
        const flat = await this.flatsService.getEntity(dto.flatId);
        const flatSocietyId =
          flat.building?.societyId ?? flat.building?.society?.uid;
        if (
          flatSocietyId !== (membership.societyId ?? membership.society.uid)
        ) {
          throw new BadRequestException(
            'Flat does not belong to the membership society',
          );
        }
        await this.ensureNoDuplicateFlatMembership(
          membership.userId ?? membership.user.uid,
          flat.uid,
          uid,
        );
        membership.flat = flat;
      }
    }

    if (dto.type !== undefined) membership.type = dto.type;
    if (dto.status !== undefined) membership.status = dto.status;
    if (dto.startedAt !== undefined) {
      membership.startedAt = dto.startedAt ? new Date(dto.startedAt) : null;
    }
    if (dto.endedAt !== undefined) {
      membership.endedAt = dto.endedAt ? new Date(dto.endedAt) : null;
    }
    if (dto.isPrimary === true) {
      await this.clearPrimary(
        membership.userId ?? membership.user.uid,
        membership.societyId ?? membership.society.uid,
        uid,
      );
      membership.isPrimary = true;
    } else if (dto.isPrimary === false) {
      membership.isPrimary = false;
    }

    await this.membershipsRepo.save(membership);
    return this.findOne(uid);
  }

  async remove(uid: string): Promise<MembershipResponse> {
    return this.update(uid, {
      status: 'INACTIVE',
      endedAt: new Date().toISOString(),
    });
  }

  private async getEntity(uid: string): Promise<Membership> {
    const membership = await this.membershipsRepo.findOne({
      where: { uid },
      relations: { user: true, society: true, flat: true },
    });
    if (!membership) {
      throw new NotFoundException(`Membership ${uid} not found`);
    }
    return membership;
  }

  private async ensureNoDuplicateFlatMembership(
    userId: string,
    flatId: string,
    excludeUid?: string,
  ) {
    const existing = await this.membershipsRepo.findOne({
      where: {
        user: { uid: userId },
        flat: { uid: flatId },
        status: Not('INACTIVE'),
      },
    });
    if (existing && existing.uid !== excludeUid) {
      throw new ConflictException(
        'User already has an active membership for this flat',
      );
    }
  }

  private async ensureNoDuplicateSocietyMembership(
    userId: string,
    societyId: string,
    type: string,
  ) {
    const existing = await this.membershipsRepo.findOne({
      where: {
        user: { uid: userId },
        society: { uid: societyId },
        flat: IsNull(),
        type: type as Membership['type'],
        status: Not('INACTIVE'),
      },
    });
    if (existing) {
      throw new ConflictException(
        `User already has an active ${type} membership in this society`,
      );
    }
  }

  private async clearPrimary(
    userId: string,
    societyId: string,
    excludeUid?: string,
  ) {
    const rows = await this.membershipsRepo.find({
      where: {
        user: { uid: userId },
        society: { uid: societyId },
        isPrimary: true,
      },
    });
    for (const row of rows) {
      if (row.uid === excludeUid) continue;
      row.isPrimary = false;
    }
    if (rows.length) {
      await this.membershipsRepo.save(rows);
    }
  }
}
