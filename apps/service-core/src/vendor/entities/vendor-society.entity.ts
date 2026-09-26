import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Vendor } from './vendor.entity.js';

export type VendorSocietyStatus = 'INVITED' | 'ACTIVE' | 'SUSPENDED';

@Entity('vendor_societies')
@Unique(['vendorId', 'societyId'])
export class VendorSociety {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ type: 'varchar', length: 32, default: 'ACTIVE' })
  status: VendorSocietyStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'approved_by_user_id', type: 'uuid', nullable: true })
  approvedByUserId: string | null;

  @Column({ name: 'approved_at', type: 'timestamp', nullable: true })
  approvedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
