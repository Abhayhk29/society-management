import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SocietyModule } from '../society/society.module.js';
import { ComplaintsController } from './complaints.controller.js';
import { ComplaintsService } from './complaints.service.js';
import { Complaint } from './entities/complaint.entity.js';
import { Notice } from './entities/notice.entity.js';
import { Visitor } from './entities/visitor.entity.js';
import { NoticesController } from './notices.controller.js';
import { NoticesService } from './notices.service.js';
import { VisitorsController } from './visitors.controller.js';
import { VisitorsService } from './visitors.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notice, Complaint, Visitor]),
    AuthModule,
    SocietyModule,
    NotificationsModule,
  ],
  controllers: [NoticesController, ComplaintsController, VisitorsController],
  providers: [NoticesService, ComplaintsService, VisitorsService],
  exports: [NoticesService, ComplaintsService, VisitorsService, TypeOrmModule],
})
export class CommunityModule {}
