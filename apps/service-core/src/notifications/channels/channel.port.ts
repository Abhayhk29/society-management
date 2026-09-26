export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');

export interface NotificationChannels {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendSms(to: string, body: string): Promise<void>;
  sendPush(userId: string, title: string, body: string): Promise<void>;
}
