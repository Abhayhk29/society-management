import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Building } from './building.entity.js';
import { Membership } from './membership.entity.js';

@Entity('flats')
@Unique('uq_flat_building_number', ['building', 'number'])
export class Flat {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @ManyToOne(() => Building, (building) => building.flats, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'building_id', referencedColumnName: 'uid' })
  building: Building;

  @RelationId((flat: Flat) => flat.building)
  buildingId: string;

  @Column({ type: 'varchar', length: 50 })
  number: string;

  @Column({ type: 'int', nullable: true })
  floor: number | null;

  @Column({ name: 'unit_type', type: 'varchar', length: 50, nullable: true })
  unitType: string | null;

  @Column({
    name: 'area_sq_ft',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: {
      to: (value?: number | string | null) => value ?? null,
      from: (value: string | null) =>
        value === null || value === undefined ? null : Number(value),
    },
  })
  areaSqFt: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Membership, (membership) => membership.flat)
  memberships: Membership[];
}
