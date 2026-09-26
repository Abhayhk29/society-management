import {
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateGatePassDto {
  @IsUUID()
  societyId: string;

  @IsOptional()
  @IsUUID()
  flatId?: string;

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

  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @IsOptional()
  @IsISO8601()
  validUntil?: string;
}

export class RejectGatePassDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}

export class VerifyQrDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  qrPayload: string;
}
