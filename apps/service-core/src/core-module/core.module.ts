import { Module } from '@nestjs/common';
import { EnvironmentModule } from '@society/nest-config';
import { DatabaseModule } from './database/database.module';

@Module({
  imports: [EnvironmentModule.forRoot(), DatabaseModule],
  exports: [EnvironmentModule, DatabaseModule],
})
export class CoreModule {}
