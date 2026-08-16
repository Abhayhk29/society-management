import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { HEALTH_PACKAGE, healthProto } from 'shared-protos';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const grpcUrl = process.env.GRPC_URL ?? '0.0.0.0:50051';

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: HEALTH_PACKAGE,
      protoPath: healthProto,
      url: grpcUrl,
      loader: { keepCase: false, longs: String, enums: String, defaults: true, oneofs: true },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3002);
  console.log(`service-core HTTP on ${process.env.PORT ?? 3002}, gRPC on ${grpcUrl}`);
}
bootstrap();
