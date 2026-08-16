import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

/**
 * Shared env/config module for NestJS apps.
 *
 * @nestjs/config v4's ConfigModule.forRoot() returns Promise<DynamicModule>,
 * so this module must use an async forRoot() that awaits it. Exporting the
 * ConfigModule class from a decorator that only imported the Promise was why
 * ConfigService was missing in consumers like TypeOrmModule.forRootAsync.
 */
@Global()
@Module({})
export class EnvironmentModule {
  static async forRoot(): Promise<DynamicModule> {
    const configModule = await ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
    });

    return {
      module: EnvironmentModule,
      global: true,
      imports: [configModule],
      exports: [ConfigModule],
    };
  }
}
