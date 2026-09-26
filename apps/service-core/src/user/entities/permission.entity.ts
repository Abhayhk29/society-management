import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RolePermission } from './role-permission.entity.js';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  action: string;

  @Column({ type: 'varchar', length: 50 })
  module: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions: RolePermission[];
}
