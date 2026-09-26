import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannels } from './channel.port.js';

/**
 * Dev/default adapters — log outbound EMAIL/SMS/PUSH.
 * Swap for Twilio / SES / FCM later via NOTIFICATION_CHANNELS provider.
 */
@Injectable()
export class ConsoleNotificationChannels implements NotificationChannels {
  private readonly logger = new Logger(ConsoleNotificationChannels.name);

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.logger.log(`[EMAIL → ${to}] ${subject}\n${body}`);
  }

  async sendSms(to: string, body: string): Promise<void> {
    this.logger.log(`[SMS → ${to}] ${body}`);
  }

  async sendPush(userId: string, title: string, body: string): Promise<void> {
    this.logger.log(`[PUSH → user:${userId}] ${title}\n${body}`);
  }
}
