import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { HEALTH_SERVICE } from 'shared-protos';
import {
  ANALYTICS_GRPC,
  CORE_GRPC,
  REALTIME_GRPC,
} from './grpc-clients.module';

export interface HealthCheckResponse {
  status: string;
  service: string;
}

interface HealthServiceClient {
  check(data: Record<string, never>): Observable<HealthCheckResponse>;
}

@Injectable()
export class GrpcHealthService implements OnModuleInit {
  private core!: HealthServiceClient;
  private realtime!: HealthServiceClient;
  private analytics!: HealthServiceClient;

  constructor(
    @Inject(CORE_GRPC) private readonly coreClient: ClientGrpc,
    @Inject(REALTIME_GRPC) private readonly realtimeClient: ClientGrpc,
    @Inject(ANALYTICS_GRPC) private readonly analyticsClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.core = this.coreClient.getService<HealthServiceClient>(HEALTH_SERVICE);
    this.realtime =
      this.realtimeClient.getService<HealthServiceClient>(HEALTH_SERVICE);
    this.analytics =
      this.analyticsClient.getService<HealthServiceClient>(HEALTH_SERVICE);
  }

  checkCore() {
    return firstValueFrom(this.core.check({}));
  }

  checkRealtime() {
    return firstValueFrom(this.realtime.check({}));
  }

  checkAnalytics() {
    return firstValueFrom(this.analytics.check({}));
  }
}
