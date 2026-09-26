import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateBillDto {
  @IsUUID()
  societyId: string;

  @IsOptional()
  @IsUUID()
  flatId?: string;

  @IsOptional()
  @IsUUID()
  membershipId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsIn(['MAINTENANCE', 'WATER', 'OTHER'])
  category?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  currency?: string;

  @IsISO8601()
  dueDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsBoolean()
  issueNow?: boolean;
}

export class UpdateBillDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsIn(['MAINTENANCE', 'WATER', 'OTHER'])
  category?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsISO8601()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string | null;
}

export class PayBillDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @IsIn(['CASH', 'UPI', 'CARD', 'MANUAL'])
  method: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;
}
