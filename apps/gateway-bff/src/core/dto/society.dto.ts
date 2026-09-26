import {
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateSocietyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9_-]+$/)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  pincode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateSocietyDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9_-]+$/)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  pincode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateBuildingDto {
  @IsUUID()
  societyId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9_-]+$/)
  code: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalFloors?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateBuildingDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9_-]+$/)
  code?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalFloors?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateFlatDto {
  @IsUUID()
  buildingId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  number: string;

  @IsOptional()
  @IsInt()
  floor?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unitType?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  areaSqFt?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateFlatDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  number?: string;

  @IsOptional()
  @IsInt()
  floor?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unitType?: string | null;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  areaSqFt?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

const MEMBERSHIP_TYPES = [
  'OWNER',
  'TENANT',
  'FAMILY',
  'COMMITTEE',
  'STAFF',
] as const;

const MEMBERSHIP_STATUSES = ['ACTIVE', 'PENDING', 'INACTIVE'] as const;

export class CreateMembershipDto {
  @IsUUID()
  userId: string;

  @IsUUID()
  societyId: string;

  @IsOptional()
  @IsUUID()
  flatId?: string;

  @IsIn(MEMBERSHIP_TYPES)
  type: (typeof MEMBERSHIP_TYPES)[number];

  @IsOptional()
  @IsIn(MEMBERSHIP_STATUSES)
  status?: (typeof MEMBERSHIP_STATUSES)[number];

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsISO8601()
  startedAt?: string;

  @IsOptional()
  @IsISO8601()
  endedAt?: string;
}

export class UpdateMembershipDto {
  @IsOptional()
  @IsUUID()
  flatId?: string | null;

  @IsOptional()
  @IsIn(MEMBERSHIP_TYPES)
  type?: (typeof MEMBERSHIP_TYPES)[number];

  @IsOptional()
  @IsIn(MEMBERSHIP_STATUSES)
  status?: (typeof MEMBERSHIP_STATUSES)[number];

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsISO8601()
  startedAt?: string | null;

  @IsOptional()
  @IsISO8601()
  endedAt?: string | null;
}
