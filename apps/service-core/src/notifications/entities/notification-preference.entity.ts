import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Entity('notification_preferences')
@Unique(['userId'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'email_enabled', type: 'boolean', default: true })
  emailEnabled: boolean;

  @Column({ name: 'sms_enabled', type: 'boolean', default: true })
  smsEnabled: boolean;

  @Column({ name: 'push_enabled', type: 'boolean', default: true })
  pushEnabled: boolean;

  @Column({ name: 'in_app_enabled', type: 'boolean', default: true })
  inAppEnabled: boolean;

  /** Comma-separated muted event types */
  @Column({ name: 'muted_types', type: 'varchar', length: 500, default: '' })
  mutedTypes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
