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
import {
  AddVendorDocumentDto,
  AssignVendorSocietyDto,
  AssignWorkOrderDto,
  CompleteWorkOrderDto,
  CreateVendorDto,
  CreateWorkOrderDto,
  DecideQuoteDto,
  ProposeQuoteDto,
  ReasonDto,
  ReviewVendorDto,
  SuspendVendorDto,
  UpdateVendorDto,
  UpdateVendorSocietyDto,
  UpdateWorkOrderDto,
  VerifyVendorDocumentDto,
} from './dto/vendor.dto.js';
import { VendorGatewayService } from './vendor.service.js';

@ApiTags('vendors')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VendorController {
  constructor(private readonly vendor: VendorGatewayService) {}

  @Post('vendors')
  @RequirePermissions('manage:vendor')
  createVendor(@Body() dto: CreateVendorDto) {
    return this.vendor.createVendor(dto as unknown as Record<string, unknown>);
  }

  @Get('vendors')
  @RequirePermissions('view:vendor')
  listVendors(
    @Query('status') status?: string,
    @Query('societyId') societyId?: string,
    @Query('category') category?: string,
  ) {
    return this.vendor.listVendors(status, societyId, category);
  }

  @Get('vendors/:uid')
  @RequirePermissions('view:vendor')
  getVendor(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.vendor.getVendor(uid);
  }

  @Patch('vendors/:uid')
  @RequirePermissions('manage:vendor')
  updateVendor(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateVendorDto,
  ) {
    return this.vendor.updateVendor(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('vendors/:uid/submit')
  @RequirePermissions('manage:vendor')
  submitVendor(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.vendor.submitVendor(uid);
  }

  @Post('vendors/:uid/review')
  @RequirePermissions('manage:vendor')
  reviewVendor(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: ReviewVendorDto,
  ) {
    return this.vendor.reviewVendor(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('vendors/:uid/suspend')
  @RequirePermissions('manage:vendor')
  suspendVendor(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: SuspendVendorDto,
  ) {
    return this.vendor.suspendVendor(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('vendors/:uid/documents')
  @RequirePermissions('manage:vendor')
  addDocument(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: AddVendorDocumentDto,
  ) {
    return this.vendor.addDocument(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Get('vendors/:uid/documents')
  @RequirePermissions('view:vendor')
  listDocuments(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.vendor.listDocuments(uid);
  }

  @Post('vendor-documents/:uid/verify')
  @RequirePermissions('manage:vendor')
  verifyDocument(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: VerifyVendorDocumentDto,
  ) {
    return this.vendor.verifyDocument(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('vendors/:uid/societies')
  @RequirePermissions('manage:vendor')
  assignSociety(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: AssignVendorSocietyDto,
  ) {
    return this.vendor.assignSociety(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Get('vendors/:uid/societies')
  @RequirePermissions('view:vendor')
  listSocieties(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.vendor.listSocieties(uid);
  }

  @Patch('vendor-societies/:uid')
  @RequirePermissions('manage:vendor')
  updateSociety(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateVendorSocietyDto,
  ) {
    return this.vendor.updateSociety(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('work-orders')
  @RequirePermissions('create:work_order')
  createWorkOrder(@Body() dto: CreateWorkOrderDto) {
    return this.vendor.createWorkOrder(
      dto as unknown as Record<string, unknown>,
    );
  }

  @Get('work-orders')
  @RequirePermissions('view:work_order')
  listWorkOrders(
    @Query('societyId', ParseUUIDPipe) societyId: string,
    @Query('status') status?: string,
    @Query('vendorId') vendorId?: string,
    @Query('category') category?: string,
  ) {
    return this.vendor.listWorkOrders(societyId, status, vendorId, category);
  }

  @Get('work-orders/:uid')
  @RequirePermissions('view:work_order')
  getWorkOrder(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.vendor.getWorkOrder(uid);
  }

  @Patch('work-orders/:uid')
  @RequirePermissions('manage:work_order')
  updateWorkOrder(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateWorkOrderDto,
  ) {
    return this.vendor.updateWorkOrder(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('work-orders/:uid/assign')
  @RequirePermissions('manage:work_order')
  assignWorkOrder(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: AssignWorkOrderDto,
  ) {
    return this.vendor.assignWorkOrder(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('work-orders/:uid/start')
  @RequirePermissions('update:work_order')
  startWorkOrder(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.vendor.startWorkOrder(uid);
  }

  @Post('work-orders/:uid/complete')
  @RequirePermissions('update:work_order')
  completeWorkOrder(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: CompleteWorkOrderDto,
  ) {
    return this.vendor.completeWorkOrder(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('work-orders/:uid/verify')
  @RequirePermissions('manage:work_order')
  verifyWorkOrder(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.vendor.verifyWorkOrder(uid);
  }

  @Post('work-orders/:uid/hold')
  @RequirePermissions('update:work_order')
  holdWorkOrder(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: ReasonDto,
  ) {
    return this.vendor.holdWorkOrder(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('work-orders/:uid/cancel')
  @RequirePermissions('manage:work_order')
  cancelWorkOrder(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: ReasonDto,
  ) {
    return this.vendor.cancelWorkOrder(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('work-orders/:uid/quotes')
  @RequirePermissions('update:work_order')
  proposeQuote(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: ProposeQuoteDto,
  ) {
    return this.vendor.proposeQuote(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Get('work-orders/:uid/quotes')
  @RequirePermissions('view:work_order')
  listQuotes(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.vendor.listQuotes(uid);
  }

  @Post('work-order-quotes/:uid/decide')
  @RequirePermissions('manage:work_order')
  decideQuote(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: DecideQuoteDto,
  ) {
    return this.vendor.decideQuote(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Get('work-orders/:uid/events')
  @RequirePermissions('view:work_order')
  listEvents(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.vendor.listEvents(uid);
  }
}
