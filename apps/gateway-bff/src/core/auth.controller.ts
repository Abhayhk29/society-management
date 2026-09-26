import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { CoreRbacService } from './core-rbac.service.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly coreRbac: CoreRbacService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.coreRbac.register(dto as unknown as Record<string, unknown>);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.coreRbac.login(dto as unknown as Record<string, unknown>);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.coreRbac.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.coreRbac.logout(dto.refreshToken);
  }

  @Post('logout-all')
  logoutAll(@Headers('authorization') authorization?: string) {
    return this.coreRbac.logoutAll(this.extractBearer(authorization));
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.coreRbac.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.coreRbac.resetPassword(dto.token, dto.newPassword);
  }

  @Post('otp/send')
  sendOtp(
    @Body() dto: SendOtpDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.coreRbac.sendOtp(
      dto.phoneNumber,
      dto.purpose,
      this.extractBearer(authorization) || undefined,
    );
  }

  @Post('otp/verify')
  verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.coreRbac.verifyOtp({
      phoneNumber: dto.phoneNumber,
      purpose: dto.purpose,
      code: dto.code,
      newPassword: dto.newPassword,
      accessToken: this.extractBearer(authorization) || undefined,
    });
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    return this.coreRbac.me(this.extractBearer(authorization));
  }

  private extractBearer(authorization?: string): string {
    if (!authorization?.startsWith('Bearer ')) {
      return '';
    }
    return authorization.slice(7).trim();
  }
}
