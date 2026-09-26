import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class EnqueueNotificationDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  userIds: string[];

  @IsOptional()
  @IsUUID()
  societyId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(64)
  type: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(1)
  body: string;

  @IsOptional()
  @IsString()
  payloadJson?: string;

  @IsOptional()
  @IsArray()
  @IsIn(['IN_APP', 'EMAIL', 'SMS', 'PUSH'], { each: true })
  channels?: Array<'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH'>;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  sourceService?: string;
}

export class UpdatePreferencesDto {
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  mutedTypes?: string;
}

export class ListNotificationsQueryDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unreadOnly?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsUUID()
  societyId?: string;
}
