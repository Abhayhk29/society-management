import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../user/entities/role.entity.js';
import { User } from '../user/entities/user.entity.js';
import { UserModule } from '../user/user.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { OtpCode } from './entities/otp-code.entity.js';
import { PasswordResetToken } from './entities/password-reset-token.entity.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { ConsoleNotificationService } from './notifications/console.notification.js';
import { NOTIFICATION_PORT } from './notifications/notification.port.js';

@Module({
  imports: [
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([
      User,
      Role,
      RefreshToken,
      PasswordResetToken,
      OtpCode,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-society-jwt-secret'),
        signOptions: {
          expiresIn: Number(config.get('JWT_EXPIRES_IN_SECONDS', 900)),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    PermissionsGuard,
    {
      provide: NOTIFICATION_PORT,
      useClass: ConsoleNotificationService,
    },
  ],
  exports: [AuthService, JwtModule, JwtAuthGuard, PermissionsGuard],
})
export class AuthModule {}
