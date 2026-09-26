import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { coreEntities } from './entities.js';

/**
 * TypeORM CLI data source (migrations generate/run).
 * Loads DB_* from the environment; copy apps/service-core/.env.example → .env first.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'society_core',
  entities: coreEntities,
  migrations: ['src/database/migrations/*{.ts,.js}'],
  synchronize: false,
});
