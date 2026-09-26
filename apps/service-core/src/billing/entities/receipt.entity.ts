import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { Payment } from './payment.entity.js';

@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @OneToOne(() => Payment, (payment) => payment.receipt, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payment_id', referencedColumnName: 'uid' })
  payment: Payment;

  @RelationId((receipt: Receipt) => receipt.payment)
  paymentId: string;

  @Column({ name: 'bill_id', type: 'uuid' })
  billId: string;

  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'receipt_number', type: 'varchar', length: 40, unique: true })
  receiptNumber: string;

  @Column({ name: 'issued_at', type: 'timestamp' })
  issuedAt: Date;

  @Column({ name: 'snapshot_json', type: 'text' })
  snapshotJson: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
