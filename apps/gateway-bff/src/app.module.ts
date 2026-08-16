import { Module } from '@nestjs/common';
import { EnvironmentModule } from '@society/nest-config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GrpcClientsModule } from './grpc/grpc-clients.module';

@Module({
  imports: [EnvironmentModule.forRoot(), GrpcClientsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
