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
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import type { AuthUser } from '../auth/auth-user.type.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { CreateBillDto, PayBillDto, UpdateBillDto } from './dto/billing.dto.js';
import { BillsService } from './bills.service.js';
import { PaymentsService } from './payments.service.js';

@Controller('bills')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BillsController {
  constructor(
    private readonly billsService: BillsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  @RequirePermissions('create:bills')
  create(@Body() dto: CreateBillDto, @CurrentUser() user: AuthUser) {
    return this.billsService.create(dto, user.uid);
  }

  @Get()
  @RequirePermissions('view:bills')
  list(
    @Query('societyId', ParseUUIDPipe) societyId: string,
    @Query('status') status?: string,
  ) {
    return this.billsService.findBySociety(societyId, status);
  }

  @Get(':uid')
  @RequirePermissions('view:bills')
  get(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.billsService.findOne(uid);
  }

  @Patch(':uid')
  @RequirePermissions('create:bills')
  update(@Param('uid', ParseUUIDPipe) uid: string, @Body() dto: UpdateBillDto) {
    return this.billsService.update(uid, dto);
  }

  @Post(':uid/issue')
  @RequirePermissions('create:bills')
  issue(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.billsService.issue(uid);
  }

  @Post(':uid/cancel')
  @RequirePermissions('create:bills')
  cancel(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.billsService.cancel(uid);
  }

  @Post(':uid/pay')
  @RequirePermissions('pay:bills')
  pay(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: PayBillDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.paymentsService.pay(uid, dto, user.uid);
  }

  @Get(':uid/payments')
  @RequirePermissions('view:bills')
  payments(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.paymentsService.listByBill(uid);
  }
}
