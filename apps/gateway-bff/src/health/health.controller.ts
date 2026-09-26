import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController, ApiTags } from '@nestjs/swagger';

@ApiExcludeController()
@ApiTags('health')
@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'gateway-bff',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  ready() {
    // Gateway is ready when the process is up; dependency checks live on backends.
    return {
      status: 'ready',
      service: 'gateway-bff',
      timestamp: new Date().toISOString(),
    };
  }
}
