import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { BillingGatewayService } from './billing.service.js';
import { CreateBillDto, PayBillDto, UpdateBillDto } from './dto/billing.dto.js';

@ApiTags('billing')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BillingController {
  constructor(private readonly billing: BillingGatewayService) {}

  @Post('bills')
  @RequirePermissions('create:bills')
  createBill(@Body() dto: CreateBillDto) {
    return this.billing.createBill(dto as unknown as Record<string, unknown>);
  }

  @Get('bills')
  @RequirePermissions('view:bills')
  listBills(
    @Query('societyId', ParseUUIDPipe) societyId: string,
    @Query('status') status?: string,
  ) {
    return this.billing.listBills(societyId, status);
  }

  @Get('bills/:uid')
  @RequirePermissions('view:bills')
  getBill(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.billing.getBill(uid);
  }

  @Patch('bills/:uid')
  @RequirePermissions('create:bills')
  updateBill(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateBillDto,
  ) {
    return this.billing.updateBill(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('bills/:uid/issue')
  @RequirePermissions('create:bills')
  issue(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.billing.issueBill(uid);
  }

  @Post('bills/:uid/cancel')
  @RequirePermissions('create:bills')
  cancel(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.billing.cancelBill(uid);
  }

  @Post('bills/:uid/pay')
  @RequirePermissions('pay:bills')
  pay(@Param('uid', ParseUUIDPipe) uid: string, @Body() dto: PayBillDto) {
    return this.billing.payBill(uid, dto as unknown as Record<string, unknown>);
  }

  @Get('bills/:uid/payments')
  @RequirePermissions('view:bills')
  listPayments(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.billing.listPayments(uid);
  }

  @Get('payments/:uid')
  @RequirePermissions('view:bills')
  getPayment(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.billing.getPayment(uid);
  }

  @Get('receipts')
  @RequirePermissions('view:bills')
  listReceipts(@Query('societyId', ParseUUIDPipe) societyId: string) {
    return this.billing.listReceipts(societyId);
  }

  @Get('receipts/by-payment/:paymentId')
  @RequirePermissions('view:bills')
  receiptByPayment(@Param('paymentId', ParseUUIDPipe) paymentId: string) {
    return this.billing.getReceiptByPayment(paymentId);
  }

  @Get('receipts/:uid')
  @RequirePermissions('view:bills')
  getReceipt(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.billing.getReceipt(uid);
  }
}
