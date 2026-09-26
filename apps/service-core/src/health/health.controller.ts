import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller()
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'service-core',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async ready() {
    try {
      if (!this.dataSource.isInitialized) {
        throw new Error('DataSource not initialized');
      }
      await this.dataSource.query('SELECT 1');
      return {
        status: 'ready',
        service: 'service-core',
        database: 'up',
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'not_ready',
        service: 'service-core',
        database: 'down',
      });
    }
  }
}
