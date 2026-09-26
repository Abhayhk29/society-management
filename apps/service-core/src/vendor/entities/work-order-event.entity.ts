import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WorkOrder } from './work-order.entity.js';

@Entity('work_order_events')
export class WorkOrderEvent {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @ManyToOne(() => WorkOrder, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'work_order_id' })
  workOrder: WorkOrder;

  @Column({ name: 'work_order_id', type: 'uuid' })
  workOrderId: string;

  @Column({ name: 'actor_user_id', type: 'uuid' })
  actorUserId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 64 })
  eventType: string;

  @Column({ name: 'from_status', type: 'varchar', length: 32, nullable: true })
  fromStatus: string | null;

  @Column({ name: 'to_status', type: 'varchar', length: 32, nullable: true })
  toStatus: string | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
