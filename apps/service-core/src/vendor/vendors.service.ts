import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service.js';
import { SocietiesService } from '../society/societies.service.js';
import {
  AddVendorDocumentDto,
  AssignVendorSocietyDto,
  CreateVendorDto,
  ReviewVendorDto,
  SuspendVendorDto,
  UpdateVendorDto,
  UpdateVendorSocietyDto,
  VerifyVendorDocumentDto,
} from './dto/vendor.dto.js';
import { VendorDocument } from './entities/vendor-document.entity.js';
import { VendorSociety } from './entities/vendor-society.entity.js';
import { Vendor } from './entities/vendor.entity.js';
import {
  toDocResponse,
  toSocietyAssignResponse,
  toVendorResponse,
  VendorDocumentResponse,
  VendorResponse,
  VendorSocietyResponse,
} from './vendor.mapper.js';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor) private readonly vendorsRepo: Repository<Vendor>,
    @InjectRepository(VendorDocument)
    private readonly docsRepo: Repository<VendorDocument>,
    @InjectRepository(VendorSociety)
    private readonly societyRepo: Repository<VendorSociety>,
    private readonly societiesService: SocietiesService,
    private readonly notifications: NotificationsService,
  ) {}

  async create(
    dto: CreateVendorDto,
    actorUserId: string,
  ): Promise<VendorResponse> {
    const submitNow = dto.submitNow === true;
    const vendor = await this.vendorsRepo.save(
      this.vendorsRepo.create({
        displayName: dto.displayName.trim(),
        companyName: dto.companyName.trim(),
        contactPhone: dto.contactPhone?.trim() || null,
        contactEmail: dto.contactEmail?.trim() || null,
        categories: (dto.categories ?? 'GENERAL').trim().toUpperCase(),
        status: submitNow ? 'PENDING_REVIEW' : 'DRAFT',
        gstNumber: dto.gstNumber?.trim() || null,
        panNumber: dto.panNumber?.trim() || null,
        address: dto.address?.trim() || null,
        city: dto.city?.trim() || null,
        notes: dto.notes?.trim() || null,
        userId: dto.userId ?? null,
        createdByUserId: actorUserId,
      }),
    );
    return toVendorResponse(vendor);
  }

  async list(filters: {
    status?: string;
    societyId?: string;
    category?: string;
  }): Promise<VendorResponse[]> {
    let vendorIds: string[] | undefined;
    if (filters.societyId) {
      await this.societiesService.getEntity(filters.societyId);
      const assigns = await this.societyRepo.find({
        where: { societyId: filters.societyId, status: 'ACTIVE' },
      });
      vendorIds = assigns.map((a) => a.vendorId);
      if (vendorIds.length === 0) return [];
    }

    const qb = this.vendorsRepo
      .createQueryBuilder('v')
      .orderBy('v.created_at', 'DESC');
    if (filters.status) {
      qb.andWhere('v.status = :status', { status: filters.status });
    }
    if (vendorIds) {
      qb.andWhere('v.uid IN (:...ids)', { ids: vendorIds });
    }
    if (filters.category) {
      qb.andWhere('UPPER(v.categories) LIKE :cat', {
        cat: `%${filters.category.toUpperCase()}%`,
      });
    }
    const rows = await qb.getMany();
    return rows.map(toVendorResponse);
  }

  async findOne(uid: string): Promise<VendorResponse> {
    return toVendorResponse(await this.getEntity(uid));
  }

  async update(uid: string, dto: UpdateVendorDto): Promise<VendorResponse> {
    const vendor = await this.getEntity(uid);
    if (vendor.status === 'SUSPENDED') {
      throw new BadRequestException('Cannot update a suspended vendor');
    }
    if (dto.displayName !== undefined)
      vendor.displayName = dto.displayName.trim();
    if (dto.companyName !== undefined)
      vendor.companyName = dto.companyName.trim();
    if (dto.contactPhone !== undefined)
      vendor.contactPhone = dto.contactPhone?.trim() || null;
    if (dto.contactEmail !== undefined)
      vendor.contactEmail = dto.contactEmail?.trim() || null;
    if (dto.categories !== undefined)
      vendor.categories = dto.categories.trim().toUpperCase();
    if (dto.gstNumber !== undefined)
      vendor.gstNumber = dto.gstNumber?.trim() || null;
    if (dto.panNumber !== undefined)
      vendor.panNumber = dto.panNumber?.trim() || null;
    if (dto.address !== undefined) vendor.address = dto.address?.trim() || null;
    if (dto.city !== undefined) vendor.city = dto.city?.trim() || null;
    if (dto.notes !== undefined) vendor.notes = dto.notes?.trim() || null;
    if (dto.userId !== undefined) vendor.userId = dto.userId;
    await this.vendorsRepo.save(vendor);
    return this.findOne(uid);
  }

  async submit(uid: string): Promise<VendorResponse> {
    const vendor = await this.getEntity(uid);
    if (vendor.status !== 'DRAFT' && vendor.status !== 'REJECTED') {
      throw new BadRequestException(
        'Only DRAFT or REJECTED vendors can be submitted',
      );
    }
    vendor.status = 'PENDING_REVIEW';
    vendor.rejectionReason = null;
    await this.vendorsRepo.save(vendor);
    return this.findOne(uid);
  }

  async review(
    uid: string,
    dto: ReviewVendorDto,
    actorUserId: string,
  ): Promise<VendorResponse> {
    const vendor = await this.getEntity(uid);
    if (vendor.status !== 'PENDING_REVIEW') {
      throw new BadRequestException('Vendor is not pending review');
    }
    if (dto.approve) {
      vendor.status = 'APPROVED';
      vendor.rejectionReason = null;
    } else {
      vendor.status = 'REJECTED';
      vendor.rejectionReason =
        dto.rejectionReason?.trim() || 'Rejected by reviewer';
    }
    vendor.reviewedByUserId = actorUserId;
    vendor.reviewedAt = new Date();
    await this.vendorsRepo.save(vendor);
    if (vendor.userId) {
      this.notifications.notifySafe({
        userIds: [vendor.userId],
        type: dto.approve ? 'VENDOR_APPROVED' : 'VENDOR_REJECTED',
        title: dto.approve ? 'Vendor approved' : 'Vendor rejected',
        body: dto.approve
          ? `${vendor.displayName} is approved for society work`
          : vendor.rejectionReason || 'Application rejected',
        payload: { vendorId: vendor.uid },
        sourceService: 'core',
      });
    }
    return this.findOne(uid);
  }

  async suspend(
    uid: string,
    dto: SuspendVendorDto,
    actorUserId: string,
  ): Promise<VendorResponse> {
    const vendor = await this.getEntity(uid);
    if (vendor.status !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED vendors can be suspended');
    }
    vendor.status = 'SUSPENDED';
    vendor.notes = [vendor.notes, dto.reason?.trim()]
      .filter(Boolean)
      .join('\n');
    vendor.reviewedByUserId = actorUserId;
    vendor.reviewedAt = new Date();
    await this.vendorsRepo.save(vendor);

    const assigns = await this.societyRepo.find({
      where: { vendorId: uid, status: In(['ACTIVE', 'INVITED']) },
    });
    for (const a of assigns) {
      a.status = 'SUSPENDED';
      await this.societyRepo.save(a);
    }
    return this.findOne(uid);
  }

  async addDocument(
    vendorId: string,
    dto: AddVendorDocumentDto,
  ): Promise<VendorDocumentResponse> {
    await this.getEntity(vendorId);
    const doc = await this.docsRepo.save(
      this.docsRepo.create({
        vendorId,
        docType: dto.docType,
        label: dto.label.trim(),
        referenceOrUrl: dto.referenceOrUrl.trim(),
        notes: dto.notes?.trim() || null,
        status: 'SUBMITTED',
      }),
    );
    return toDocResponse(doc);
  }

  async listDocuments(vendorId: string): Promise<VendorDocumentResponse[]> {
    await this.getEntity(vendorId);
    const rows = await this.docsRepo.find({
      where: { vendorId },
      order: { createdAt: 'DESC' },
    });
    return rows.map(toDocResponse);
  }

  async verifyDocument(
    uid: string,
    dto: VerifyVendorDocumentDto,
    actorUserId: string,
  ): Promise<VendorDocumentResponse> {
    const doc = await this.docsRepo.findOne({ where: { uid } });
    if (!doc) throw new NotFoundException(`Document ${uid} not found`);
    if (doc.status !== 'SUBMITTED') {
      throw new BadRequestException('Document is not awaiting verification');
    }
    doc.status = dto.approve ? 'VERIFIED' : 'REJECTED';
    doc.notes = dto.notes?.trim() || doc.notes;
    doc.verifiedByUserId = actorUserId;
    doc.verifiedAt = new Date();
    await this.docsRepo.save(doc);
    return toDocResponse(doc);
  }

  async assignSociety(
    vendorId: string,
    dto: AssignVendorSocietyDto,
    actorUserId: string,
  ): Promise<VendorSocietyResponse> {
    const vendor = await this.getEntity(vendorId);
    if (vendor.status !== 'APPROVED') {
      throw new BadRequestException(
        'Only APPROVED vendors can be assigned to a society',
      );
    }
    await this.societiesService.getEntity(dto.societyId);
    const existing = await this.societyRepo.findOne({
      where: { vendorId, societyId: dto.societyId },
    });
    if (existing) {
      existing.status = 'ACTIVE';
      existing.notes = dto.notes?.trim() || existing.notes;
      existing.approvedByUserId = actorUserId;
      existing.approvedAt = new Date();
      await this.societyRepo.save(existing);
      return toSocietyAssignResponse(existing);
    }
    const row = await this.societyRepo.save(
      this.societyRepo.create({
        vendorId,
        societyId: dto.societyId,
        status: 'ACTIVE',
        notes: dto.notes?.trim() || null,
        approvedByUserId: actorUserId,
        approvedAt: new Date(),
      }),
    );
    return toSocietyAssignResponse(row);
  }

  async listSocieties(vendorId: string): Promise<VendorSocietyResponse[]> {
    await this.getEntity(vendorId);
    const rows = await this.societyRepo.find({
      where: { vendorId },
      order: { createdAt: 'DESC' },
    });
    return rows.map(toSocietyAssignResponse);
  }

  async updateSocietyAssign(
    uid: string,
    dto: UpdateVendorSocietyDto,
    actorUserId: string,
  ): Promise<VendorSocietyResponse> {
    const row = await this.societyRepo.findOne({ where: { uid } });
    if (!row) throw new NotFoundException(`Assignment ${uid} not found`);
    row.status = dto.status;
    if (dto.notes !== undefined) row.notes = dto.notes?.trim() || null;
    if (dto.status === 'ACTIVE') {
      row.approvedByUserId = actorUserId;
      row.approvedAt = new Date();
    }
    await this.societyRepo.save(row);
    return toSocietyAssignResponse(row);
  }

  async getEntity(uid: string): Promise<Vendor> {
    const vendor = await this.vendorsRepo.findOne({ where: { uid } });
    if (!vendor) throw new NotFoundException(`Vendor ${uid} not found`);
    return vendor;
  }

  async assertActiveForSociety(
    vendorId: string,
    societyId: string,
  ): Promise<Vendor> {
    const vendor = await this.getEntity(vendorId);
    if (vendor.status !== 'APPROVED') {
      throw new BadRequestException('Vendor is not approved');
    }
    const assign = await this.societyRepo.findOne({
      where: { vendorId, societyId, status: 'ACTIVE' },
    });
    if (!assign) {
      throw new BadRequestException('Vendor is not active for this society');
    }
    return vendor;
  }
}
