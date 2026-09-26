import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';

export type NotificationDeliveryStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';

@Entity('notifications')
@Index(['userId', 'createdAt'])
@Index(['userId', 'status'])
export class Notification {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'society_id', type: 'uuid', nullable: true })
  societyId: string | null;

  @Column({ type: 'varchar', length: 16 })
  channel: NotificationChannel;

  /** Domain event type, e.g. BILL_ISSUED, GATE_PASS_APPROVED */
  @Column({ type: 'varchar', length: 64 })
  type: string;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'payload_json', type: 'text', nullable: true })
  payloadJson: string | null;

  @Column({ type: 'varchar', length: 16, default: 'PENDING' })
  status: NotificationDeliveryStatus;

  @Column({
    name: 'source_service',
    type: 'varchar',
    length: 40,
    default: 'core',
  })
  sourceService: string;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ name: 'read_at', type: 'timestamp', nullable: true })
  readAt: Date | null;

  @Column({ name: 'sent_at', type: 'timestamp', nullable: true })
  sentAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
