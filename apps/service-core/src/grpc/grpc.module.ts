import { Module } from '@nestjs/common';
import { HealthGrpcController } from './health.grpc.controller';

@Module({
  controllers: [HealthGrpcController],
})
export class GrpcModule {}
