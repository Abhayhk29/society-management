import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Role } from './role.entity.js';
import { User } from './user.entity.js';

@Entity('user_roles')
@Unique(['user', 'role'])
export class UserRole {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @ManyToOne(() => User, (user) => user.userRoles, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'uid' })
  user: User;

  @ManyToOne(() => Role, (role) => role.userRoles, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'uid' })
  role: Role;

  @CreateDateColumn({ name: 'assigned_at', type: 'timestamp' })
  assignedAt: Date;
}
