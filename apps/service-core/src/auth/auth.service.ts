import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { Role } from '../user/entities/role.entity.js';
import { User } from '../user/entities/user.entity.js';
import { UsersService } from '../user/users.service.js';
import { toUserResponse, UserResponse } from '../user/users.mapper.js';
import { AuthUser } from './auth-user.type.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { OtpCode, OtpPurpose } from './entities/otp-code.entity.js';
import { PasswordResetToken } from './entities/password-reset-token.entity.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import type { NotificationPort } from './notifications/notification.port.js';
import { NOTIFICATION_PORT } from './notifications/notification.port.js';
import {
  generateOpaqueToken,
  generateOtpCode,
  hashSecret,
} from './utils/token-crypto.js';

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserResponse;
};

@Injectable()
export class AuthService {
  private readonly accessExpiresInSeconds: number;
  private readonly refreshExpiresInSeconds: number;
  private readonly resetExpiresInSeconds: number;
  private readonly otpExpiresInSeconds: number;
  private readonly otpMaxAttempts: number;
  private readonly frontendResetUrl: string;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(NOTIFICATION_PORT)
    private readonly notifications: NotificationPort,
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Role) private readonly rolesRepo: Repository<Role>,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
    @InjectRepository(PasswordResetToken)
    private readonly resetRepo: Repository<PasswordResetToken>,
    @InjectRepository(OtpCode)
    private readonly otpRepo: Repository<OtpCode>,
  ) {
    this.accessExpiresInSeconds = Number(
      this.configService.get('JWT_EXPIRES_IN_SECONDS', 900),
    );
    this.refreshExpiresInSeconds = Number(
      this.configService.get('REFRESH_EXPIRES_IN_SECONDS', 604800),
    );
    this.resetExpiresInSeconds = Number(
      this.configService.get('PASSWORD_RESET_EXPIRES_IN_SECONDS', 3600),
    );
    this.otpExpiresInSeconds = Number(
      this.configService.get('OTP_EXPIRES_IN_SECONDS', 600),
    );
    this.otpMaxAttempts = Number(this.configService.get('OTP_MAX_ATTEMPTS', 5));
    this.frontendResetUrl = this.configService.get(
      'FRONTEND_RESET_URL',
      'http://localhost:3000/reset-password',
    );
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const user = await this.usersService.create({
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      isActive: true,
    });

    const resident = await this.rolesRepo.findOne({
      where: { name: 'RESIDENT' },
    });
    if (resident) {
      try {
        await this.usersService.assignRole(user.uid, resident.uid);
      } catch {
        // ignore if already assigned
      }
    }

    const fullUser = await this.usersService.findOne(user.uid);
    return this.issueAuth(fullUser);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.usersRepo.findOne({
      where: { email: dto.email.toLowerCase() },
      relations: { userRoles: { role: true } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    user.lastLogin = new Date();
    await this.usersRepo.save(user);

    return this.issueAuth(toUserResponse(user));
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const tokenHash = hashSecret(refreshToken);
    const stored = await this.refreshRepo.findOne({
      where: { tokenHash },
      relations: { user: { userRoles: { role: true } } },
    });

    if (
      !stored ||
      stored.revokedAt ||
      stored.expiresAt.getTime() < Date.now() ||
      !stored.user?.isActive
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    stored.revokedAt = new Date();
    await this.refreshRepo.save(stored);

    const result = await this.issueAuth(toUserResponse(stored.user));
    const created = await this.refreshRepo.findOne({
      where: { tokenHash: hashSecret(result.refreshToken) },
    });
    if (created) {
      stored.replacedBy = created.uid;
      await this.refreshRepo.save(stored);
    }
    return result;
  }

  async logout(refreshToken: string): Promise<{ revoked: boolean }> {
    const stored = await this.refreshRepo.findOne({
      where: { tokenHash: hashSecret(refreshToken) },
    });
    if (!stored || stored.revokedAt) {
      return { revoked: false };
    }
    stored.revokedAt = new Date();
    await this.refreshRepo.save(stored);
    return { revoked: true };
  }

  async logoutAll(accessToken: string): Promise<{ revoked: number }> {
    const authUser = await this.resolveAuthUser(accessToken);
    const tokens = await this.refreshRepo.find({
      where: { user: { uid: authUser.uid }, revokedAt: IsNull() },
    });
    const now = new Date();
    for (const token of tokens) {
      token.revokedAt = now;
    }
    if (tokens.length) {
      await this.refreshRepo.save(tokens);
    }
    return { revoked: tokens.length };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const message =
      'If an account exists for that email, a reset link has been sent.';
    const user = await this.usersRepo.findOne({
      where: { email: email.toLowerCase() },
    });
    if (!user || !user.isActive) {
      return { message };
    }

    const raw = generateOpaqueToken();
    await this.resetRepo.save(
      this.resetRepo.create({
        user,
        tokenHash: hashSecret(raw),
        expiresAt: new Date(Date.now() + this.resetExpiresInSeconds * 1000),
        usedAt: null,
      }),
    );

    const link = `${this.frontendResetUrl}?token=${raw}`;
    await this.notifications.sendEmail(
      user.email,
      'Reset your Nivas password',
      `Use this link within ${Math.round(this.resetExpiresInSeconds / 60)} minutes:\n${link}\n\nToken: ${raw}`,
    );
    return { message };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const stored = await this.resetRepo.findOne({
      where: { tokenHash: hashSecret(token) },
      relations: { user: true },
    });
    if (
      !stored ||
      stored.usedAt ||
      stored.expiresAt.getTime() < Date.now() ||
      !stored.user
    ) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    stored.user.passwordHash = await bcrypt.hash(newPassword, 10);
    stored.usedAt = new Date();
    await this.usersRepo.save(stored.user);
    await this.resetRepo.save(stored);
    await this.revokeAllRefreshTokens(stored.user.uid);
    return { message: 'Password updated successfully' };
  }

  async sendOtp(
    phoneNumber: string,
    purpose: OtpPurpose,
    accessToken?: string,
  ): Promise<{ message: string; expiresIn: number }> {
    const phone = phoneNumber.trim();
    if (!phone) {
      throw new BadRequestException('Phone number is required');
    }

    const recent = await this.otpRepo.count({
      where: {
        phoneNumber: phone,
        purpose,
        createdAt: MoreThan(new Date(Date.now() - 60_000)),
      },
    });
    if (recent > 0) {
      throw new BadRequestException(
        'Please wait before requesting another OTP',
      );
    }

    let userId: string | null = null;
    if (purpose === 'VERIFY_PHONE') {
      if (!accessToken) {
        throw new UnauthorizedException('Login required to verify phone');
      }
      const authUser = await this.resolveAuthUser(accessToken);
      const user = await this.usersRepo.findOne({
        where: { uid: authUser.uid },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const taken = await this.usersRepo.findOne({
        where: { phoneNumber: phone },
      });
      if (taken && taken.uid !== user.uid) {
        throw new BadRequestException('Phone number already in use');
      }
      user.phoneNumber = phone;
      await this.usersRepo.save(user);
      userId = user.uid;
    } else {
      const user = await this.usersRepo.findOne({
        where: { phoneNumber: phone },
      });
      if (!user || !user.isActive) {
        // avoid enumeration for LOGIN / RESET
        return {
          message: 'If the phone number is registered, an OTP has been sent.',
          expiresIn: this.otpExpiresInSeconds,
        };
      }
      userId = user.uid;
    }

    const code = generateOtpCode(6);
    await this.otpRepo.save(
      this.otpRepo.create({
        phoneNumber: phone,
        userId,
        purpose,
        codeHash: hashSecret(code),
        expiresAt: new Date(Date.now() + this.otpExpiresInSeconds * 1000),
        attempts: 0,
        consumedAt: null,
      }),
    );

    await this.notifications.sendSms(
      phone,
      `Your Nivas OTP is ${code}. Valid for ${Math.round(this.otpExpiresInSeconds / 60)} minutes.`,
    );

    return {
      message:
        purpose === 'VERIFY_PHONE'
          ? 'OTP sent'
          : 'If the phone number is registered, an OTP has been sent.',
      expiresIn: this.otpExpiresInSeconds,
    };
  }

  async verifyOtp(input: {
    phoneNumber: string;
    purpose: OtpPurpose;
    code: string;
    newPassword?: string;
    accessToken?: string;
  }): Promise<AuthResult | { verified: boolean; message: string }> {
    const phone = input.phoneNumber.trim();
    const otp = await this.otpRepo.findOne({
      where: {
        phoneNumber: phone,
        purpose: input.purpose,
        consumedAt: IsNull(),
      },
      order: { createdAt: 'DESC' },
    });

    if (!otp || otp.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    if (otp.attempts >= this.otpMaxAttempts) {
      throw new BadRequestException('OTP attempts exceeded');
    }

    if (hashSecret(input.code) !== otp.codeHash) {
      otp.attempts += 1;
      await this.otpRepo.save(otp);
      throw new BadRequestException('Invalid or expired OTP');
    }

    otp.consumedAt = new Date();
    await this.otpRepo.save(otp);

    if (input.purpose === 'VERIFY_PHONE') {
      if (!input.accessToken) {
        throw new UnauthorizedException('Login required to verify phone');
      }
      const authUser = await this.resolveAuthUser(input.accessToken);
      const user = await this.usersRepo.findOne({
        where: { uid: authUser.uid },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      user.phoneNumber = phone;
      user.phoneVerifiedAt = new Date();
      await this.usersRepo.save(user);
      return { verified: true, message: 'Phone verified successfully' };
    }

    const user = await this.usersRepo.findOne({
      where: { phoneNumber: phone },
      relations: { userRoles: { role: true } },
    });
    if (!user || !user.isActive) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (input.purpose === 'RESET_PASSWORD') {
      if (!input.newPassword || input.newPassword.length < 8) {
        throw new BadRequestException('newPassword is required');
      }
      user.passwordHash = await bcrypt.hash(input.newPassword, 10);
      await this.usersRepo.save(user);
      await this.revokeAllRefreshTokens(user.uid);
      return { verified: true, message: 'Password updated successfully' };
    }

    // LOGIN
    user.lastLogin = new Date();
    if (!user.phoneVerifiedAt) {
      user.phoneVerifiedAt = new Date();
    }
    await this.usersRepo.save(user);
    return this.issueAuth(toUserResponse(user));
  }

  async me(accessToken: string): Promise<UserResponse> {
    const authUser = await this.resolveAuthUser(accessToken);
    const user = await this.usersService.findOne(authUser.uid);
    return { ...user, permissions: authUser.permissions ?? [] };
  }

  async resolveAuthUser(accessToken: string): Promise<AuthUser> {
    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(accessToken);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const user = await this.usersRepo.findOne({
      where: { uid: payload.sub },
      relations: {
        userRoles: {
          role: {
            rolePermissions: {
              permission: true,
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid or inactive account');
    }

    const roles = user.userRoles?.map((ur) => ur.role.name) ?? [];
    const permissions = Array.from(
      new Set(
        user.userRoles?.flatMap(
          (ur) =>
            ur.role.rolePermissions?.map((rp) => rp.permission.action) ?? [],
        ) ?? [],
      ),
    );

    return {
      uid: user.uid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      roles,
      permissions,
    };
  }

  private async issueAuth(user: UserResponse): Promise<AuthResult> {
    const accessToken = this.jwtService.sign(
      { sub: user.uid, email: user.email },
      { expiresIn: this.accessExpiresInSeconds },
    );
    const refreshToken = generateOpaqueToken();
    const entityUser = await this.usersRepo.findOne({
      where: { uid: user.uid },
    });
    if (!entityUser) {
      throw new UnauthorizedException('User not found');
    }

    await this.refreshRepo.save(
      this.refreshRepo.create({
        user: entityUser,
        tokenHash: hashSecret(refreshToken),
        expiresAt: new Date(Date.now() + this.refreshExpiresInSeconds * 1000),
        revokedAt: null,
        replacedBy: null,
      }),
    );

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessExpiresInSeconds,
      user,
    };
  }

  private async revokeAllRefreshTokens(userId: string) {
    const tokens = await this.refreshRepo.find({
      where: { user: { uid: userId }, revokedAt: IsNull() },
    });
    const now = new Date();
    for (const token of tokens) {
      token.revokedAt = now;
    }
    if (tokens.length) {
      await this.refreshRepo.save(tokens);
    }
  }
}
