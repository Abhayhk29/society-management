import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type VendorStatus =
  'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @Column({ name: 'display_name', type: 'varchar', length: 160 })
  displayName: string;

  @Column({ name: 'company_name', type: 'varchar', length: 200 })
  companyName: string;

  @Column({
    name: 'contact_phone',
    type: 'varchar',
    length: 40,
    nullable: true,
  })
  contactPhone: string | null;

  @Column({
    name: 'contact_email',
    type: 'varchar',
    length: 160,
    nullable: true,
  })
  contactEmail: string | null;

  /** Comma-separated service categories, e.g. PLUMBING,ELECTRICAL */
  @Column({ type: 'varchar', length: 400, default: 'GENERAL' })
  categories: string;

  @Column({ type: 'varchar', length: 32, default: 'DRAFT' })
  status: VendorStatus;

  @Column({ name: 'gst_number', type: 'varchar', length: 32, nullable: true })
  gstNumber: string | null;

  @Column({ name: 'pan_number', type: 'varchar', length: 20, nullable: true })
  panNumber: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  /** Optional login user with VENDOR role */
  @Column({ name: 'user_id', type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId: string;

  @Column({ name: 'reviewed_by_user_id', type: 'uuid', nullable: true })
  reviewedByUserId: string | null;

  @Column({ name: 'reviewed_at', type: 'timestamp', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
