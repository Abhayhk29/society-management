import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Payment } from './payment.entity.js';

export type BillCategory = 'MAINTENANCE' | 'WATER' | 'OTHER';
export type BillStatus =
  'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'CANCELLED' | 'OVERDUE';

@Entity('bills')
export class Bill {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'flat_id', type: 'uuid', nullable: true })
  flatId: string | null;

  @Column({ name: 'membership_id', type: 'uuid', nullable: true })
  membershipId: string | null;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 32, default: 'OTHER' })
  category: BillCategory;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: {
      to: (v: number) => v,
      from: (v: string) => Number(v),
    },
  })
  amount: number;

  @Column({ type: 'varchar', length: 8, default: 'INR' })
  currency: string;

  @Column({ name: 'due_date', type: 'date' })
  dueDate: string;

  @Column({ type: 'varchar', length: 32, default: 'DRAFT' })
  status: BillStatus;

  @Column({ name: 'issued_at', type: 'timestamp', nullable: true })
  issuedAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  notes: string | null;

  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Payment, (payment) => payment.bill)
  payments: Payment[];
}
