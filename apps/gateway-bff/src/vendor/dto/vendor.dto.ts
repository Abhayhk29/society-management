import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVendorDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  displayName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  categories?: string;

  @IsOptional()
  @IsString()
  gstNumber?: string;

  @IsOptional()
  @IsString()
  panNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  submitNow?: boolean;
}

export class UpdateVendorDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string | null;

  @IsOptional()
  @IsEmail()
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  categories?: string;

  @IsOptional()
  @IsString()
  gstNumber?: string | null;

  @IsOptional()
  @IsString()
  panNumber?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  city?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsUUID()
  userId?: string | null;
}

export class ReviewVendorDto {
  @IsBoolean()
  approve: boolean;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class SuspendVendorDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AddVendorDocumentDto {
  @IsEnum(['PAN', 'GST', 'LICENSE', 'INSURANCE', 'OTHER'])
  docType: string;

  @IsString()
  @MinLength(1)
  label: string;

  @IsString()
  @MinLength(1)
  referenceOrUrl: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class VerifyVendorDocumentDto {
  @IsBoolean()
  approve: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignVendorSocietyDto {
  @IsUUID()
  societyId: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateVendorSocietyDto {
  @IsEnum(['INVITED', 'ACTIVE', 'SUSPENDED'])
  status: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateWorkOrderDto {
  @IsUUID()
  societyId: string;

  @IsOptional()
  @IsUUID()
  flatId?: string;

  @IsOptional()
  @IsUUID()
  buildingId?: string;

  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(3)
  description: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsUUID()
  complaintId?: string;

  @IsOptional()
  @IsString()
  scheduledStartAt?: string;

  @IsOptional()
  @IsString()
  scheduledEndAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costEstimate?: number;

  @IsOptional()
  @IsBoolean()
  openNow?: boolean;
}

export class UpdateWorkOrderDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsOptional()
  @IsString()
  scheduledStartAt?: string | null;

  @IsOptional()
  @IsString()
  scheduledEndAt?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costEstimate?: number | null;
}

export class AssignWorkOrderDto {
  @IsUUID()
  vendorId: string;

  @IsOptional()
  @IsString()
  scheduledStartAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CompleteWorkOrderDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  actualCost?: number;

  @IsOptional()
  @IsString()
  resolutionNotes?: string;
}

export class ReasonDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ProposeQuoteDto {
  @IsUUID()
  vendorId: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class DecideQuoteDto {
  @IsBoolean()
  accept: boolean;

  @IsOptional()
  @IsString()
  notes?: string;
}
