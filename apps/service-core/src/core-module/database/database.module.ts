import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentModule, isProductionEnv } from '@society/nest-config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [EnvironmentModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProd = isProductionEnv();
        const syncRequested = config.get<string>('DB_SYNC', 'false') === 'true';
        // Never auto-sync schema in production — use migrations.
        const synchronize = syncRequested && !isProd;
        const migrationsRun =
          config.get<string>('DB_MIGRATIONS_RUN', isProd ? 'true' : 'false') ===
          'true';

        return {
          type: 'postgres' as const,
          host: config.get<string>('DB_HOST', 'localhost'),
          port: Number(config.get('DB_PORT', 5432)),
          username: config.get<string>('DB_USERNAME', 'postgres'),
          password: config.get<string>('DB_PASSWORD', 'postgres'),
          database: config.get<string>('DB_NAME', 'society_core'),
          autoLoadEntities: true,
          synchronize,
          migrationsRun,
          migrations: [
            join(__dirname, '..', '..', 'database', 'migrations', '*.{js,ts}'),
          ],
        };
      },
    }),
  ],
})
export class DatabaseModule {}
