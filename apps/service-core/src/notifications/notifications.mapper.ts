import { NotificationPreference } from './entities/notification-preference.entity.js';
import { Notification } from './entities/notification.entity.js';

export type NotificationResponse = {
  uid: string;
  userId: string;
  societyId: string | null;
  channel: string;
  type: string;
  title: string;
  body: string;
  payloadJson: string | null;
  status: string;
  sourceService: string;
  readAt: Date | null;
  sentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PreferencesResponse = {
  uid: string;
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  mutedTypes: string;
  createdAt: Date;
  updatedAt: Date;
};

export function toNotificationResponse(n: Notification): NotificationResponse {
  return {
    uid: n.uid,
    userId: n.userId,
    societyId: n.societyId,
    channel: n.channel,
    type: n.type,
    title: n.title,
    body: n.body,
    payloadJson: n.payloadJson,
    status: n.status,
    sourceService: n.sourceService,
    readAt: n.readAt,
    sentAt: n.sentAt,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

export function toPreferencesResponse(
  p: NotificationPreference,
): PreferencesResponse {
  return {
    uid: p.uid,
    userId: p.userId,
    emailEnabled: p.emailEnabled,
    smsEnabled: p.smsEnabled,
    pushEnabled: p.pushEnabled,
    inAppEnabled: p.inAppEnabled,
    mutedTypes: p.mutedTypes,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}
