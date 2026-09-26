import { Injectable, Logger } from '@nestjs/common';
import { NotificationPort } from './notification.port.js';

@Injectable()
export class ConsoleNotificationService implements NotificationPort {
  private readonly logger = new Logger(ConsoleNotificationService.name);

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`[EMAIL → ${to}] ${subject}\n${body}`);
  }

  async sendSms(to: string, body: string): Promise<void> {
    this.logger.log(`[SMS → ${to}] ${body}`);
  }
}
