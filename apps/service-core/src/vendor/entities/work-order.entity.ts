import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type WorkOrderCategory =
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'CIVIL'
  | 'HOUSEKEEPING'
  | 'SECURITY'
  | 'GENERAL'
  | 'OTHER';

export type WorkOrderPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type WorkOrderStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'QUOTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'VERIFIED'
  | 'CANCELLED';

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'flat_id', type: 'uuid', nullable: true })
  flatId: string | null;

  @Column({ name: 'building_id', type: 'uuid', nullable: true })
  buildingId: string | null;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'varchar', length: 40, default: 'GENERAL' })
  category: WorkOrderCategory;

  @Column({ type: 'varchar', length: 16, default: 'NORMAL' })
  priority: WorkOrderPriority;

  @Column({ type: 'varchar', length: 32, default: 'OPEN' })
  status: WorkOrderStatus;

  @Column({ name: 'requested_by_user_id', type: 'uuid' })
  requestedByUserId: string;

  @Column({ name: 'assigned_vendor_id', type: 'uuid', nullable: true })
  assignedVendorId: string | null;

  /** Optional link to a complaint (no FK enforced across modules) */
  @Column({ name: 'complaint_id', type: 'uuid', nullable: true })
  complaintId: string | null;

  @Column({ name: 'scheduled_start_at', type: 'timestamp', nullable: true })
  scheduledStartAt: Date | null;

  @Column({ name: 'scheduled_end_at', type: 'timestamp', nullable: true })
  scheduledEndAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @Column({ name: 'verified_by_user_id', type: 'uuid', nullable: true })
  verifiedByUserId: string | null;

  @Column({
    name: 'cost_estimate',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  costEstimate: string | null;

  @Column({
    name: 'actual_cost',
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  actualCost: string | null;

  @Column({ type: 'varchar', length: 8, default: 'INR' })
  currency: string;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
