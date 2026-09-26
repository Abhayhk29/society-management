import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module.js';
import { BillingModule } from './billing/billing.module.js';
import { CommunityModule } from './community/community.module.js';
import { CoreModule } from './core-module/core.module';
import { GrpcModule } from './grpc/grpc.module';
import { HealthModule } from './health/health.module.js';
import { SecurityModule } from './security/security.module.js';
import { SocietyModule } from './society/society.module.js';
import { UserModule } from './user/user.module';
import { NotificationsModule } from './notifications/notifications.module.js';
import { VendorModule } from './vendor/vendor.module.js';

@Module({
  imports: [
    CoreModule,
    SecurityModule,
    UserModule,
    AuthModule,
    SocietyModule,
    BillingModule,
    CommunityModule,
    VendorModule,
    NotificationsModule,
    GrpcModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
