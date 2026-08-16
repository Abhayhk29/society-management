import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentModule } from '@society/nest-config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [EnvironmentModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'society_core'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNC', 'false') === 'true',
      }),
    }),
  ],
})
export class DatabaseModule {}
