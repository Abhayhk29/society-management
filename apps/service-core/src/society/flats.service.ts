import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateFlatDto, UpdateFlatDto } from './dto/flat.dto.js';
import { Flat } from './entities/flat.entity.js';
import { BuildingsService } from './buildings.service.js';
import { FlatResponse, toFlatResponse } from './society.mapper.js';

@Injectable()
export class FlatsService {
  constructor(
    @InjectRepository(Flat) private readonly flatsRepo: Repository<Flat>,
    private readonly buildingsService: BuildingsService,
  ) {}

  async create(dto: CreateFlatDto): Promise<FlatResponse> {
    const building = await this.buildingsService.getEntity(dto.buildingId);
    const number = dto.number.trim().toUpperCase();
    await this.ensureNumberAvailable(building.uid, number);

    const saved = await this.flatsRepo.save(
      this.flatsRepo.create({
        building,
        number,
        floor: dto.floor ?? null,
        unitType: dto.unitType?.trim() || null,
        areaSqFt: dto.areaSqFt ?? null,
        description: dto.description?.trim() || null,
        isActive: dto.isActive ?? true,
      }),
    );
    return toFlatResponse(
      await this.flatsRepo.findOneOrFail({
        where: { uid: saved.uid },
        relations: { building: { society: true } },
      }),
    );
  }

  async findByBuilding(buildingId: string): Promise<FlatResponse[]> {
    await this.buildingsService.getEntity(buildingId);
    const rows = await this.flatsRepo.find({
      where: { building: { uid: buildingId } },
      relations: { building: { society: true } },
      order: { number: 'ASC' },
    });
    return rows.map(toFlatResponse);
  }

  async findOne(uid: string): Promise<FlatResponse> {
    return toFlatResponse(await this.getEntity(uid));
  }

  async update(uid: string, dto: UpdateFlatDto): Promise<FlatResponse> {
    const flat = await this.getEntity(uid);

    if (dto.number && dto.number.trim().toUpperCase() !== flat.number) {
      const number = dto.number.trim().toUpperCase();
      await this.ensureNumberAvailable(
        flat.buildingId ?? flat.building.uid,
        number,
        uid,
      );
      flat.number = number;
    }
    if (dto.floor !== undefined) flat.floor = dto.floor;
    if (dto.unitType !== undefined) {
      flat.unitType = dto.unitType?.trim() || null;
    }
    if (dto.areaSqFt !== undefined) flat.areaSqFt = dto.areaSqFt;
    if (dto.description !== undefined) {
      flat.description = dto.description?.trim() || null;
    }
    if (dto.isActive !== undefined) flat.isActive = dto.isActive;

    await this.flatsRepo.save(flat);
    return this.findOne(uid);
  }

  async remove(uid: string): Promise<FlatResponse> {
    return this.update(uid, { isActive: false });
  }

  async getEntity(uid: string): Promise<Flat> {
    const flat = await this.flatsRepo.findOne({
      where: { uid },
      relations: { building: { society: true } },
    });
    if (!flat) {
      throw new NotFoundException(`Flat ${uid} not found`);
    }
    return flat;
  }

  private async ensureNumberAvailable(
    buildingId: string,
    number: string,
    excludeUid?: string,
  ) {
    const existing = await this.flatsRepo.findOne({
      where: { building: { uid: buildingId }, number },
    });
    if (existing && existing.uid !== excludeUid) {
      throw new ConflictException(
        `Flat ${number} already exists in this building`,
      );
    }
  }
}
