import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class HealthGrpcController {
  @GrpcMethod('HealthService', 'Check')
  check(): { status: string; service: string } {
    return { status: 'ok', service: 'service-core' };
  }
}
