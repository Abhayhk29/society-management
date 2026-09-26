import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { ReceiptsService } from './receipts.service.js';

@Controller('receipts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get()
  @RequirePermissions('view:bills')
  list(@Query('societyId', ParseUUIDPipe) societyId: string) {
    return this.receiptsService.listBySociety(societyId);
  }

  @Get('by-payment/:paymentId')
  @RequirePermissions('view:bills')
  byPayment(@Param('paymentId', ParseUUIDPipe) paymentId: string) {
    return this.receiptsService.findByPayment(paymentId);
  }

  @Get(':uid')
  @RequirePermissions('view:bills')
  get(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.receiptsService.findOne(uid);
  }
}
