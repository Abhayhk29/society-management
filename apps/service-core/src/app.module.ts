import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module.js';
import { CoreModule } from './core-module/core.module';
import { GrpcModule } from './grpc/grpc.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [CoreModule, UserModule, AuthModule, GrpcModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
