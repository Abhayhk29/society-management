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
  AddVendorDocumentDto,
  AssignVendorSocietyDto,
  CreateVendorDto,
  ReviewVendorDto,
  SuspendVendorDto,
  UpdateVendorDto,
  UpdateVendorSocietyDto,
  VerifyVendorDocumentDto,
} from './dto/vendor.dto.js';
import { VendorsService } from './vendors.service.js';

@Controller('vendors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @RequirePermissions('manage:vendor')
  create(@Body() dto: CreateVendorDto, @CurrentUser() user: AuthUser) {
    return this.vendorsService.create(dto, user.uid);
  }

  @Get()
  @RequirePermissions('view:vendor')
  list(
    @Query('status') status?: string,
    @Query('societyId') societyId?: string,
    @Query('category') category?: string,
  ) {
    return this.vendorsService.list({ status, societyId, category });
  }

  @Get(':uid')
  @RequirePermissions('view:vendor')
  get(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.vendorsService.findOne(uid);
  }

  @Patch(':uid')
  @RequirePermissions('manage:vendor')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateVendorDto,
  ) {
    return this.vendorsService.update(uid, dto);
  }

  @Post(':uid/submit')
  @RequirePermissions('manage:vendor')
  submit(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.vendorsService.submit(uid);
  }

  @Post(':uid/review')
  @RequirePermissions('manage:vendor')
  review(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: ReviewVendorDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.vendorsService.review(uid, dto, user.uid);
  }

  @Post(':uid/suspend')
  @RequirePermissions('manage:vendor')
  suspend(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: SuspendVendorDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.vendorsService.suspend(uid, dto, user.uid);
  }

  @Post(':uid/documents')
  @RequirePermissions('manage:vendor')
  addDocument(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: AddVendorDocumentDto,
  ) {
    return this.vendorsService.addDocument(uid, dto);
  }

  @Get(':uid/documents')
  @RequirePermissions('view:vendor')
  listDocuments(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.vendorsService.listDocuments(uid);
  }

  @Post(':uid/societies')
  @RequirePermissions('manage:vendor')
  assignSociety(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: AssignVendorSocietyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.vendorsService.assignSociety(uid, dto, user.uid);
  }

  @Get(':uid/societies')
  @RequirePermissions('view:vendor')
  listSocieties(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.vendorsService.listSocieties(uid);
  }
}

@Controller('vendor-documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VendorDocumentsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post(':uid/verify')
  @RequirePermissions('manage:vendor')
  verifyDocument(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: VerifyVendorDocumentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.vendorsService.verifyDocument(uid, dto, user.uid);
  }
}

@Controller('vendor-societies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class VendorSocietiesController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Patch(':uid')
  @RequirePermissions('manage:vendor')
  updateSociety(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateVendorSocietyDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.vendorsService.updateSocietyAssign(uid, dto, user.uid);
  }
}
