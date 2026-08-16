import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Permission } from './permission.entity.js';
import { Role } from './role.entity.js';

@Entity('role_permissions')
@Unique(['role', 'permission'])
export class RolePermission {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @ManyToOne(() => Role, (role) => role.rolePermissions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id', referencedColumnName: 'uid' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id', referencedColumnName: 'uid' })
  permission: Permission;

  @CreateDateColumn({ name: 'assigned_at', type: 'timestamp' })
  assignedAt: Date;
}
