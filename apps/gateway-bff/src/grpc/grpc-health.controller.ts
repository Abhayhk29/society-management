import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { GrpcHealthService, HealthCheckResponse } from './grpc-health.service';

@ApiTags('health')
@SkipThrottle({ default: true })
@Controller('grpc/health')
export class GrpcHealthController {
  constructor(private readonly grpcHealth: GrpcHealthService) {}

  @Get('core')
  checkCore(): Promise<HealthCheckResponse> {
    return this.grpcHealth.checkCore();
  }

  @Get('realtime')
  checkRealtime(): Promise<HealthCheckResponse> {
    return this.grpcHealth.checkRealtime();
  }

  @Get('analytics')
  checkAnalytics(): Promise<HealthCheckResponse> {
    return this.grpcHealth.checkAnalytics();
  }

  @Get()
  async checkAll() {
    const [core, realtime, analytics] = await Promise.allSettled([
      this.grpcHealth.checkCore(),
      this.grpcHealth.checkRealtime(),
      this.grpcHealth.checkAnalytics(),
    ]);

    return {
      core:
        core.status === 'fulfilled'
          ? core.value
          : { status: 'error', reason: String(core.reason) },
      realtime:
        realtime.status === 'fulfilled'
          ? realtime.value
          : { status: 'error', reason: String(realtime.reason) },
      analytics:
        analytics.status === 'fulfilled'
          ? analytics.value
          : { status: 'error', reason: String(analytics.reason) },
    };
  }
}
