import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateSocietyDto, UpdateSocietyDto } from './dto/society.dto.js';
import { Society } from './entities/society.entity.js';
import { SocietyResponse, toSocietyResponse } from './society.mapper.js';

@Injectable()
export class SocietiesService {
  constructor(
    @InjectRepository(Society)
    private readonly societiesRepo: Repository<Society>,
  ) {}

  async create(dto: CreateSocietyDto): Promise<SocietyResponse> {
    const code = dto.code.toUpperCase();
    await this.ensureCodeAvailable(code);

    const saved = await this.societiesRepo.save(
      this.societiesRepo.create({
        name: dto.name.trim(),
        code,
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
        state: dto.state?.trim() || null,
        pincode: dto.pincode?.trim() || null,
        description: dto.description?.trim() || null,
        isActive: dto.isActive ?? true,
      }),
    );
    return toSocietyResponse(saved);
  }

  async findAll(): Promise<SocietyResponse[]> {
    const rows = await this.societiesRepo.find({
      order: { name: 'ASC' },
    });
    return rows.map(toSocietyResponse);
  }

  async findOne(uid: string): Promise<SocietyResponse> {
    return toSocietyResponse(await this.getEntity(uid));
  }

  async update(uid: string, dto: UpdateSocietyDto): Promise<SocietyResponse> {
    const society = await this.getEntity(uid);

    if (dto.code && dto.code.toUpperCase() !== society.code) {
      await this.ensureCodeAvailable(dto.code.toUpperCase(), uid);
      society.code = dto.code.toUpperCase();
    }
    if (dto.name !== undefined) society.name = dto.name.trim();
    if (dto.address !== undefined)
      society.address = dto.address?.trim() || null;
    if (dto.city !== undefined) society.city = dto.city?.trim() || null;
    if (dto.state !== undefined) society.state = dto.state?.trim() || null;
    if (dto.pincode !== undefined) {
      society.pincode = dto.pincode?.trim() || null;
    }
    if (dto.description !== undefined) {
      society.description = dto.description?.trim() || null;
    }
    if (dto.isActive !== undefined) society.isActive = dto.isActive;

    return toSocietyResponse(await this.societiesRepo.save(society));
  }

  async remove(uid: string): Promise<SocietyResponse> {
    return this.update(uid, { isActive: false });
  }

  async getEntity(uid: string): Promise<Society> {
    const society = await this.societiesRepo.findOne({ where: { uid } });
    if (!society) {
      throw new NotFoundException(`Society ${uid} not found`);
    }
    return society;
  }

  private async ensureCodeAvailable(code: string, excludeUid?: string) {
    const existing = await this.societiesRepo.findOne({ where: { code } });
    if (existing && existing.uid !== excludeUid) {
      throw new ConflictException(`Society code ${code} already exists`);
    }
  }
}
