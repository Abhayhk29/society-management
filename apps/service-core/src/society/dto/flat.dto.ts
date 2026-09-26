import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

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
