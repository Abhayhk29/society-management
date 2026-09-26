import { Module } from '@nestjs/common';
import { EnvironmentModule } from '@society/nest-config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module.js';
import { GrpcClientsModule } from './grpc/grpc-clients.module.js';

@Module({
  imports: [EnvironmentModule.forRoot(), GrpcClientsModule, CoreModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
