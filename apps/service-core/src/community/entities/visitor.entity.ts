import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('visitors')
export class Visitor {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @Column({ name: 'society_id', type: 'uuid' })
  societyId: string;

  @Column({ name: 'flat_id', type: 'uuid', nullable: true })
  flatId: string | null;

  @Column({ name: 'host_user_id', type: 'uuid' })
  hostUserId: string;

  @Column({ name: 'visitor_name', type: 'varchar', length: 150 })
  visitorName: string;

  @Column({
    name: 'visitor_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  visitorPhone: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  purpose: string | null;

  @Column({ name: 'expected_at', type: 'timestamp' })
  expectedAt: Date;

  @Column({ type: 'varchar', length: 32, default: 'EXPECTED' })
  status: 'EXPECTED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';

  @Column({ name: 'checked_in_at', type: 'timestamp', nullable: true })
  checkedInAt: Date | null;

  @Column({ name: 'checked_out_at', type: 'timestamp', nullable: true })
  checkedOutAt: Date | null;

  @Column({ name: 'gate_pass_id', type: 'uuid', nullable: true })
  gatePassId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
