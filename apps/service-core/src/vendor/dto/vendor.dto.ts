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
  @MaxLength(40)
  contactPhone?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  categories?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  gstNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  panNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
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
  @MinLength(2)
  @MaxLength(160)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  contactPhone?: string | null;

  @IsOptional()
  @IsEmail()
  contactEmail?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  categories?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  gstNumber?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  panNumber?: string | null;

  @IsOptional()
  @IsString()
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
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
  docType: 'PAN' | 'GST' | 'LICENSE' | 'INSURANCE' | 'OTHER';

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  label: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
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
  status: 'INVITED' | 'ACTIVE' | 'SUSPENDED';

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
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(3)
  description: string;

  @IsOptional()
  @IsEnum([
    'PLUMBING',
    'ELECTRICAL',
    'CIVIL',
    'HOUSEKEEPING',
    'SECURITY',
    'GENERAL',
    'OTHER',
  ])
  category?:
    | 'PLUMBING'
    | 'ELECTRICAL'
    | 'CIVIL'
    | 'HOUSEKEEPING'
    | 'SECURITY'
    | 'GENERAL'
    | 'OTHER';

  @IsOptional()
  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

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
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  description?: string;

  @IsOptional()
  @IsEnum([
    'PLUMBING',
    'ELECTRICAL',
    'CIVIL',
    'HOUSEKEEPING',
    'SECURITY',
    'GENERAL',
    'OTHER',
  ])
  category?:
    | 'PLUMBING'
    | 'ELECTRICAL'
    | 'CIVIL'
    | 'HOUSEKEEPING'
    | 'SECURITY'
    | 'GENERAL'
    | 'OTHER';

  @IsOptional()
  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

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

export class HoldOrCancelWorkOrderDto {
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
