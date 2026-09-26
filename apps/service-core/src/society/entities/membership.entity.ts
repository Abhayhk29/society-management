import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity.js';
import { Flat } from './flat.entity.js';
import { Society } from './society.entity.js';

export type MembershipType =
  'OWNER' | 'TENANT' | 'FAMILY' | 'COMMITTEE' | 'STAFF';

export type MembershipStatus = 'ACTIVE' | 'PENDING' | 'INACTIVE';

@Entity('memberships')
@Index('idx_membership_user_society', ['user', 'society'])
export class Membership {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'uid' })
  user: User;

  @RelationId((membership: Membership) => membership.user)
  userId: string;

  @ManyToOne(() => Society, (society) => society.memberships, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'society_id', referencedColumnName: 'uid' })
  society: Society;

  @RelationId((membership: Membership) => membership.society)
  societyId: string;

  @ManyToOne(() => Flat, (flat) => flat.memberships, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'flat_id', referencedColumnName: 'uid' })
  flat: Flat | null;

  @RelationId((membership: Membership) => membership.flat)
  flatId: string | null;

  @Column({ type: 'varchar', length: 32 })
  type: MembershipType;

  @Column({ type: 'varchar', length: 32, default: 'ACTIVE' })
  status: MembershipStatus;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;
}
