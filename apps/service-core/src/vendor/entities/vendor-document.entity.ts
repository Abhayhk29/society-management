import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vendor } from './vendor.entity.js';

export type VendorDocType = 'PAN' | 'GST' | 'LICENSE' | 'INSURANCE' | 'OTHER';

export type VendorDocStatus = 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

@Entity('vendor_documents')
export class VendorDocument {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @ManyToOne(() => Vendor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @Column({ name: 'vendor_id', type: 'uuid' })
  vendorId: string;

  @Column({ name: 'doc_type', type: 'varchar', length: 32 })
  docType: VendorDocType;

  @Column({ type: 'varchar', length: 160 })
  label: string;

  @Column({ name: 'reference_or_url', type: 'varchar', length: 500 })
  referenceOrUrl: string;

  @Column({ type: 'varchar', length: 32, default: 'SUBMITTED' })
  status: VendorDocStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'verified_by_user_id', type: 'uuid', nullable: true })
  verifiedByUserId: string | null;

  @Column({ name: 'verified_at', type: 'timestamp', nullable: true })
  verifiedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
