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
import type { AuthUser } from '../auth/auth-user.type.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import {
  AssignWorkOrderDto,
  CompleteWorkOrderDto,
  CreateWorkOrderDto,
  DecideQuoteDto,
  HoldOrCancelWorkOrderDto,
  ProposeQuoteDto,
  UpdateWorkOrderDto,
} from './dto/vendor.dto.js';
import { WorkOrdersService } from './work-orders.service.js';

@Controller('work-orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkOrdersController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post()
  @RequirePermissions('create:work_order')
  create(@Body() dto: CreateWorkOrderDto, @CurrentUser() user: AuthUser) {
    return this.workOrdersService.create(dto, user.uid);
  }

  @Get()
  @RequirePermissions('view:work_order')
  list(
    @Query('societyId', ParseUUIDPipe) societyId: string,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
    @Query('category') category?: string,
  ) {
    return this.workOrdersService.list({
      societyId,
      status,
      vendorId,
      category,
    });
  }

  @Get(':uid')
  @RequirePermissions('view:work_order')
  get(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.workOrdersService.findOne(uid);
  }

  @Patch(':uid')
  @RequirePermissions('manage:work_order')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateWorkOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workOrdersService.update(uid, dto, user.uid);
  }

  @Post(':uid/assign')
  @RequirePermissions('manage:work_order')
  assign(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: AssignWorkOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workOrdersService.assign(uid, dto, user.uid);
  }

  @Post(':uid/start')
  @RequirePermissions('update:work_order')
  start(
    @Param('uid', ParseUUIDPipe) uid: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workOrdersService.start(uid, user.uid);
  }

  @Post(':uid/complete')
  @RequirePermissions('update:work_order')
  complete(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: CompleteWorkOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workOrdersService.complete(uid, dto, user.uid);
  }

  @Post(':uid/verify')
  @RequirePermissions('manage:work_order')
  verify(
    @Param('uid', ParseUUIDPipe) uid: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workOrdersService.verify(uid, user.uid);
  }

  @Post(':uid/hold')
  @RequirePermissions('update:work_order')
  hold(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: HoldOrCancelWorkOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workOrdersService.hold(uid, dto, user.uid);
  }

  @Post(':uid/cancel')
  @RequirePermissions('manage:work_order')
  cancel(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: HoldOrCancelWorkOrderDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workOrdersService.cancel(uid, dto, user.uid);
  }

  @Post(':uid/quotes')
  @RequirePermissions('update:work_order')
  proposeQuote(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: ProposeQuoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workOrdersService.proposeQuote(uid, dto, user.uid);
  }

  @Get(':uid/quotes')
  @RequirePermissions('view:work_order')
  listQuotes(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.workOrdersService.listQuotes(uid);
  }

  @Get(':uid/events')
  @RequirePermissions('view:work_order')
  listEvents(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.workOrdersService.listEvents(uid);
  }
}

@Controller('work-order-quotes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkOrderQuotesController {
  constructor(private readonly workOrdersService: WorkOrdersService) {}

  @Post(':uid/decide')
  @RequirePermissions('manage:work_order')
  decideQuote(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: DecideQuoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.workOrdersService.decideQuote(uid, dto, user.uid);
  }
}
