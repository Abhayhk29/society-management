import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SocietyModule } from '../society/society.module.js';
import { BillsController } from './bills.controller.js';
import { BillsService } from './bills.service.js';
import { Bill, Payment, Receipt } from './entities/index.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { ReceiptsController } from './receipts.controller.js';
import { ReceiptsService } from './receipts.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bill, Payment, Receipt]),
    AuthModule,
    SocietyModule,
    NotificationsModule,
  ],
  controllers: [BillsController, PaymentsController, ReceiptsController],
  providers: [BillsService, PaymentsService, ReceiptsService],
  exports: [BillsService, PaymentsService, ReceiptsService, TypeOrmModule],
})
export class BillingModule {}
