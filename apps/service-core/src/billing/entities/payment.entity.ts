import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { Bill } from './bill.entity.js';
import { Receipt } from './receipt.entity.js';

export type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'MANUAL';
export type PaymentStatus = 'SUCCESS' | 'FAILED' | 'REFUNDED';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @ManyToOne(() => Bill, (bill) => bill.payments, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bill_id', referencedColumnName: 'uid' })
  bill: Bill;

  @RelationId((payment: Payment) => payment.bill)
  billId: string;

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

  @Column({ type: 'varchar', length: 32 })
  method: PaymentMethod;

  @Column({ type: 'varchar', length: 100, nullable: true })
  reference: string | null;

  @Column({ name: 'paid_by_user_id', type: 'uuid' })
  paidByUserId: string;

  @Column({ name: 'paid_at', type: 'timestamp' })
  paidAt: Date;

  @Column({ type: 'varchar', length: 32, default: 'SUCCESS' })
  status: PaymentStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @OneToOne(() => Receipt, (receipt) => receipt.payment)
  receipt?: Receipt;
}
