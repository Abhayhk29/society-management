import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core-module/core.module';
import { GrpcModule } from './grpc/grpc.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [CoreModule, UserModule, GrpcModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
