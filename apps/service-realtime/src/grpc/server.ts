import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { HEALTH_SERVICE, healthProto } from 'shared-protos';

type HealthCheckResponse = { status: string; service: string };

export function startGrpcServer(url: string, serviceName: string): grpc.Server {
  const packageDefinition = protoLoader.loadSync(healthProto, {
    keepCase: false,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const proto = grpc.loadPackageDefinition(packageDefinition) as any;
  const healthService = proto.society.common.v1[HEALTH_SERVICE];

  const server = new grpc.Server();
  server.addService(healthService.service, {
    check: (
      _call: grpc.ServerUnaryCall<unknown, HealthCheckResponse>,
      callback: grpc.sendUnaryData<HealthCheckResponse>,
    ) => {
      callback(null, { status: 'ok', service: serviceName });
    },
  });

  server.bindAsync(
    url,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error('Failed to start gRPC server:', error);
        return;
      }
      console.log(`service-realtime gRPC listening on ${url} (port ${port})`);
    },
  );

  return server;
}
