import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
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
  channels?: string[];
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
