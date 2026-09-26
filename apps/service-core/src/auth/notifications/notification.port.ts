export const NOTIFICATION_PORT = Symbol('NOTIFICATION_PORT');

export interface NotificationPort {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendSms(to: string, body: string): Promise<void>;
}
