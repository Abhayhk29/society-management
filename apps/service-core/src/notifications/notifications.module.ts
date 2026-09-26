import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { Membership } from '../society/entities/membership.entity.js';
import { User } from '../user/entities/user.entity.js';
import { NOTIFICATION_CHANNELS } from './channels/channel.port.js';
import { ConsoleNotificationChannels } from './channels/console.channels.js';
import { NotificationPreference } from './entities/notification-preference.entity.js';
import { Notification } from './entities/notification.entity.js';
import { ServiceOrJwtAuthGuard } from './guards/service-or-jwt.guard.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationPreference,
      User,
      Membership,
    ]),
    AuthModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    ServiceOrJwtAuthGuard,
    {
      provide: NOTIFICATION_CHANNELS,
      useClass: ConsoleNotificationChannels,
    },
  ],
  exports: [NotificationsService, TypeOrmModule],
})
export class NotificationsModule {}
