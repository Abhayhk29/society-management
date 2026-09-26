import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module.js';
import { User } from '../user/entities/user.entity.js';
import { BuildingsController } from './buildings.controller.js';
import { BuildingsService } from './buildings.service.js';
import { Building, Flat, Membership, Society } from './entities/index.js';
import { FlatsController } from './flats.controller.js';
import { FlatsService } from './flats.service.js';
import { MembershipsController } from './memberships.controller.js';
import { MembershipsService } from './memberships.service.js';
import { SocietiesController } from './societies.controller.js';
import { SocietiesService } from './societies.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Society, Building, Flat, Membership, User]),
    AuthModule,
  ],
  controllers: [
    SocietiesController,
    BuildingsController,
    FlatsController,
    MembershipsController,
  ],
  providers: [
    SocietiesService,
    BuildingsService,
    FlatsService,
    MembershipsService,
  ],
  exports: [
    TypeOrmModule,
    SocietiesService,
    BuildingsService,
    FlatsService,
    MembershipsService,
  ],
})
export class SocietyModule {}
