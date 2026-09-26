import {
  IsIn,
  IsString,
  Length,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

const PURPOSES = ['VERIFY_PHONE', 'LOGIN', 'RESET_PASSWORD'] as const;

export class SendOtpDto {
  @IsString()
  @MaxLength(20)
  phoneNumber: string;

  @IsIn(PURPOSES)
  purpose: (typeof PURPOSES)[number];
}

export class VerifyOtpDto {
  @IsString()
  @MaxLength(20)
  phoneNumber: string;

  @IsIn(PURPOSES)
  purpose: (typeof PURPOSES)[number];

  @IsString()
  @Length(4, 8)
  code: string;

  @ValidateIf((o: VerifyOtpDto) => o.purpose === 'RESET_PASSWORD')
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  newPassword?: string;
}
