import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBuildingDto, UpdateBuildingDto } from './dto/building.dto.js';
import { Building } from './entities/building.entity.js';
import { SocietiesService } from './societies.service.js';
import { BuildingResponse, toBuildingResponse } from './society.mapper.js';

@Injectable()
export class BuildingsService {
  constructor(
    @InjectRepository(Building)
    private readonly buildingsRepo: Repository<Building>,
    private readonly societiesService: SocietiesService,
  ) {}

  async create(dto: CreateBuildingDto): Promise<BuildingResponse> {
    const society = await this.societiesService.getEntity(dto.societyId);
    const code = dto.code.toUpperCase();
    await this.ensureCodeAvailable(society.uid, code);

    const saved = await this.buildingsRepo.save(
      this.buildingsRepo.create({
        society,
        name: dto.name.trim(),
        code,
        totalFloors: dto.totalFloors ?? null,
        description: dto.description?.trim() || null,
        isActive: dto.isActive ?? true,
      }),
    );
    return toBuildingResponse(saved);
  }

  async findBySociety(societyId: string): Promise<BuildingResponse[]> {
    await this.societiesService.getEntity(societyId);
    const rows = await this.buildingsRepo.find({
      where: { society: { uid: societyId } },
      relations: { society: true },
      order: { name: 'ASC' },
    });
    return rows.map(toBuildingResponse);
  }

  async findOne(uid: string): Promise<BuildingResponse> {
    return toBuildingResponse(await this.getEntity(uid));
  }

  async update(uid: string, dto: UpdateBuildingDto): Promise<BuildingResponse> {
    const building = await this.getEntity(uid);

    if (dto.code && dto.code.toUpperCase() !== building.code) {
      await this.ensureCodeAvailable(
        building.societyId ?? building.society.uid,
        dto.code.toUpperCase(),
        uid,
      );
      building.code = dto.code.toUpperCase();
    }
    if (dto.name !== undefined) building.name = dto.name.trim();
    if (dto.totalFloors !== undefined) building.totalFloors = dto.totalFloors;
    if (dto.description !== undefined) {
      building.description = dto.description?.trim() || null;
    }
    if (dto.isActive !== undefined) building.isActive = dto.isActive;

    return toBuildingResponse(await this.buildingsRepo.save(building));
  }

  async remove(uid: string): Promise<BuildingResponse> {
    return this.update(uid, { isActive: false });
  }

  async getEntity(uid: string): Promise<Building> {
    const building = await this.buildingsRepo.findOne({
      where: { uid },
      relations: { society: true },
    });
    if (!building) {
      throw new NotFoundException(`Building ${uid} not found`);
    }
    return building;
  }

  private async ensureCodeAvailable(
    societyId: string,
    code: string,
    excludeUid?: string,
  ) {
    const existing = await this.buildingsRepo.findOne({
      where: { society: { uid: societyId }, code },
    });
    if (existing && existing.uid !== excludeUid) {
      throw new ConflictException(
        `Building code ${code} already exists in this society`,
      );
    }
  }
}
