import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsOptional,
  IsUUID,
} from 'class-validator';

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
