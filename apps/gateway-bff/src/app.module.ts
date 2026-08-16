import { Module } from '@nestjs/common';
import { EnvironmentModule } from '@society/nest-config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [EnvironmentModule.forRoot()],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
