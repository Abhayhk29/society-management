import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BillingModule } from '../billing/billing.module.js';
import { CommunityModule } from '../community/community.module.js';
import { SocietyModule } from '../society/society.module.js';
import { UserModule } from '../user/user.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { VendorModule } from '../vendor/vendor.module.js';
import { AuthGrpcController } from './auth.grpc.controller.js';
import { NotificationGrpcController } from './notification.grpc.controller.js';
import {
  BillGrpcController,
  PaymentGrpcController,
  ReceiptGrpcController,
} from './billing.grpc.controller.js';
import {
  ComplaintGrpcController,
  NoticeGrpcController,
  VisitorGrpcController,
} from './community.grpc.controller.js';
import { HealthGrpcController } from './health.grpc.controller.js';
import {
  VendorGrpcController,
  WorkOrderGrpcController,
} from './vendor.grpc.controller.js';
import { PermissionGrpcController } from './permission.grpc.controller.js';
import { RoleGrpcController } from './role.grpc.controller.js';
import {
  BuildingGrpcController,
  FlatGrpcController,
  MembershipGrpcController,
  SocietyGrpcController,
} from './society.grpc.controller.js';
import { UserGrpcController } from './user.grpc.controller.js';

@Module({
  imports: [
    UserModule,
    AuthModule,
    SocietyModule,
    BillingModule,
    CommunityModule,
    VendorModule,
    NotificationsModule,
  ],
  controllers: [
    HealthGrpcController,
    UserGrpcController,
    RoleGrpcController,
    PermissionGrpcController,
    AuthGrpcController,
    SocietyGrpcController,
    BuildingGrpcController,
    FlatGrpcController,
    MembershipGrpcController,
    BillGrpcController,
    PaymentGrpcController,
    ReceiptGrpcController,
    NoticeGrpcController,
    ComplaintGrpcController,
    VisitorGrpcController,
    VendorGrpcController,
    WorkOrderGrpcController,
    NotificationGrpcController,
  ],
})
export class GrpcModule {}
