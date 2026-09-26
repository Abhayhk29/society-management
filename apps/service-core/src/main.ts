import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import {
  CORE_PACKAGE,
  HEALTH_PACKAGE,
  healthProto,
  userProto,
} from 'shared-protos';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const grpcUrl = process.env.GRPC_URL ?? '0.0.0.0:50051';

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: [HEALTH_PACKAGE, CORE_PACKAGE],
      protoPath: [healthProto, userProto],
      url: grpcUrl,
      loader: {
        keepCase: false,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3002);
  console.log(
    `service-core HTTP on ${process.env.PORT ?? 3002}, gRPC on ${grpcUrl}`,
  );
}
bootstrap();
