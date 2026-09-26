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
import { Flat } from './flat.entity.js';
import { Society } from './society.entity.js';

@Entity('buildings')
@Unique('uq_building_society_code', ['society', 'code'])
export class Building {
  @PrimaryGeneratedColumn('uuid', { name: 'uid' })
  uid: string;

  @ManyToOne(() => Society, (society) => society.buildings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'society_id', referencedColumnName: 'uid' })
  society: Society;

  @RelationId((building: Building) => building.society)
  societyId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  code: string;

  @Column({ name: 'total_floors', type: 'int', nullable: true })
  totalFloors: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @OneToMany(() => Flat, (flat) => flat.building)
  flats: Flat[];
}
