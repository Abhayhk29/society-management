import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @MaxLength(100)
  action: string;

  @IsString()
  @MaxLength(50)
  module: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdatePermissionDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  action?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  module?: string;

  @IsOptional()
  @IsString()
  description?: string | null;
}
