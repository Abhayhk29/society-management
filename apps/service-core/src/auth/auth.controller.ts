import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { SendOtpDto, VerifyOtpDto } from './dto/otp.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Post('logout-all')
  logoutAll(@Headers('authorization') authorization?: string) {
    return this.authService.logoutAll(this.extractBearer(authorization));
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('otp/send')
  sendOtp(
    @Body() dto: SendOtpDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.authService.sendOtp(
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
    return this.authService.verifyOtp({
      phoneNumber: dto.phoneNumber,
      purpose: dto.purpose,
      code: dto.code,
      newPassword: dto.newPassword,
      accessToken: this.extractBearer(authorization) || undefined,
    });
  }

  @Get('me')
  me(@Headers('authorization') authorization?: string) {
    return this.authService.me(this.extractBearer(authorization));
  }

  private extractBearer(authorization?: string): string {
    if (!authorization?.startsWith('Bearer ')) {
      return '';
    }
    return authorization.slice(7).trim();
  }
}
