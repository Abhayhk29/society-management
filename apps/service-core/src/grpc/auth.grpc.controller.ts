import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from '../auth/auth.service.js';
import { OtpPurpose } from '../auth/entities/otp-code.entity.js';
import { toRpcException } from './grpc-exception.util.js';
import { mapUser } from './user-grpc.mapper.js';

@Controller()
export class AuthGrpcController {
  constructor(private readonly authService: AuthService) {}

  @GrpcMethod('AuthService', 'Register')
  async register(data: {
    email: string;
    phoneNumber?: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    try {
      const result = await this.authService.register({
        email: data.email,
        phoneNumber: data.phoneNumber || undefined,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      return this.toAuthResponse(result);
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('AuthService', 'Login')
  async login(data: { email: string; password: string }) {
    try {
      const result = await this.authService.login({
        email: data.email,
        password: data.password,
      });
      return this.toAuthResponse(result);
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('AuthService', 'Me')
  async me(data: { accessToken: string }) {
    try {
      return mapUser(await this.authService.me(data.accessToken));
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('AuthService', 'Refresh')
  async refresh(data: { refreshToken: string }) {
    try {
      return this.toAuthResponse(
        await this.authService.refresh(data.refreshToken),
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('AuthService', 'Logout')
  async logout(data: { refreshToken: string }) {
    try {
      const result = await this.authService.logout(data.refreshToken);
      return { revoked: result.revoked, revokedCount: 0 };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('AuthService', 'LogoutAll')
  async logoutAll(data: { accessToken: string }) {
    try {
      const result = await this.authService.logoutAll(data.accessToken);
      return { revoked: result.revoked > 0, revokedCount: result.revoked };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('AuthService', 'ForgotPassword')
  async forgotPassword(data: { email: string }) {
    try {
      return await this.authService.forgotPassword(data.email);
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('AuthService', 'ResetPassword')
  async resetPassword(data: { token: string; newPassword: string }) {
    try {
      return await this.authService.resetPassword(
        data.token,
        data.newPassword,
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('AuthService', 'SendOtp')
  async sendOtp(data: {
    phoneNumber: string;
    purpose: string;
    accessToken?: string;
  }) {
    try {
      return await this.authService.sendOtp(
        data.phoneNumber,
        data.purpose as OtpPurpose,
        data.accessToken || undefined,
      );
    } catch (error) {
      throw toRpcException(error);
    }
  }

  @GrpcMethod('AuthService', 'VerifyOtp')
  async verifyOtp(data: {
    phoneNumber: string;
    purpose: string;
    code: string;
    newPassword?: string;
    accessToken?: string;
  }) {
    try {
      const result = await this.authService.verifyOtp({
        phoneNumber: data.phoneNumber,
        purpose: data.purpose as OtpPurpose,
        code: data.code,
        newPassword: data.newPassword || undefined,
        accessToken: data.accessToken || undefined,
      });

      if ('accessToken' in result) {
        return {
          verified: true,
          message: 'Authenticated',
          auth: this.toAuthResponse(result),
          hasAuth: true,
        };
      }

      return {
        verified: result.verified,
        message: result.message,
        auth: undefined,
        hasAuth: false,
      };
    } catch (error) {
      throw toRpcException(error);
    }
  }

  private toAuthResponse(result: Awaited<ReturnType<AuthService['login']>>) {
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      tokenType: result.tokenType,
      expiresIn: result.expiresIn,
      user: mapUser(result.user),
    };
  }
}
