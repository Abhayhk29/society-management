import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { HEALTH_PACKAGE, healthProto } from 'shared-protos';
import { GrpcHealthController } from './grpc-health.controller';
import { GrpcHealthService } from './grpc-health.service';

export const CORE_GRPC = 'CORE_GRPC';
export const REALTIME_GRPC = 'REALTIME_GRPC';
export const ANALYTICS_GRPC = 'ANALYTICS_GRPC';

const loader = {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
};

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: CORE_GRPC,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: HEALTH_PACKAGE,
            protoPath: healthProto,
            url: config.get<string>('CORE_GRPC_URL', 'localhost:50051'),
            loader,
          },
        }),
      },
      {
        name: REALTIME_GRPC,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: HEALTH_PACKAGE,
            protoPath: healthProto,
            url: config.get<string>('REALTIME_GRPC_URL', 'localhost:50052'),
            loader,
          },
        }),
      },
      {
        name: ANALYTICS_GRPC,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            package: HEALTH_PACKAGE,
            protoPath: healthProto,
            url: config.get<string>('ANALYTICS_GRPC_URL', 'localhost:50053'),
            loader,
          },
        }),
      },
    ]),
  ],
  controllers: [GrpcHealthController],
  providers: [GrpcHealthService],
})
export class GrpcClientsModule {}
