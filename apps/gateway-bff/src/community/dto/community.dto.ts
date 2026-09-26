import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateNoticeDto {
  @IsUUID()
  societyId: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1)
  body: string;

  @IsOptional()
  @IsIn(['NORMAL', 'HIGH'])
  priority?: string;

  @IsOptional()
  @IsISO8601()
  publishedAt?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

export class UpdateNoticeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  body?: string;

  @IsOptional()
  @IsIn(['NORMAL', 'HIGH'])
  priority?: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateComplaintDto {
  @IsUUID()
  societyId: string;

  @IsOptional()
  @IsUUID()
  flatId?: string;

  @IsString()
  @MaxLength(80)
  category: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1)
  description: string;
}

export class UpdateComplaintDto {
  @IsOptional()
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status?: string;

  @IsOptional()
  @IsUUID()
  assignedToUserId?: string | null;

  @IsOptional()
  @IsString()
  resolutionNotes?: string | null;
}

export class CreateVisitorDto {
  @IsUUID()
  societyId: string;

  @IsOptional()
  @IsUUID()
  flatId?: string;

  @IsOptional()
  @IsUUID()
  hostUserId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(150)
  visitorName: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  visitorPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  purpose?: string;

  @IsISO8601()
  expectedAt: string;

  @IsOptional()
  @IsUUID()
  gatePassId?: string;
}

export class UpdateVisitorDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  visitorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  visitorPhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  purpose?: string | null;

  @IsOptional()
  @IsISO8601()
  expectedAt?: string;

  @IsOptional()
  @IsUUID()
  gatePassId?: string | null;
}
