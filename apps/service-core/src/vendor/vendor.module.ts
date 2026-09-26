import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SocietyModule } from '../society/society.module.js';
import {
  Vendor,
  VendorDocument,
  VendorSociety,
  WorkOrder,
  WorkOrderEvent,
  WorkOrderQuote,
} from './entities/index.js';
import {
  VendorDocumentsController,
  VendorsController,
  VendorSocietiesController,
} from './vendors.controller.js';
import { VendorsService } from './vendors.service.js';
import {
  WorkOrderQuotesController,
  WorkOrdersController,
} from './work-orders.controller.js';
import { WorkOrdersService } from './work-orders.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vendor,
      VendorDocument,
      VendorSociety,
      WorkOrder,
      WorkOrderQuote,
      WorkOrderEvent,
    ]),
    AuthModule,
    SocietyModule,
    NotificationsModule,
  ],
  controllers: [
    VendorsController,
    VendorDocumentsController,
    VendorSocietiesController,
    WorkOrdersController,
    WorkOrderQuotesController,
  ],
  providers: [VendorsService, WorkOrdersService],
  exports: [VendorsService, WorkOrdersService, TypeOrmModule],
})
export class VendorModule {}
