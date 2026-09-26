import { Module } from '@nestjs/common';
import { EnvironmentModule } from '@society/nest-config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BillingModule } from './billing/billing.module.js';
import { CommunityModule } from './community/community.module.js';
import { CoreModule } from './core/core.module.js';
import { GatePassModule } from './gate-pass/gate-pass.module.js';
import { GrpcClientsModule } from './grpc/grpc-clients.module.js';
import { SecurityModule } from './security/security.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { HealthModule } from './health/health.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { VendorModule } from './vendor/vendor.module.js';

@Module({
  imports: [
    EnvironmentModule.forRoot(),
    SecurityModule,
    GrpcClientsModule,
    CoreModule,
    GatePassModule,
    BillingModule,
    CommunityModule,
    VendorModule,
    NotificationsModule,
    AnalyticsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
