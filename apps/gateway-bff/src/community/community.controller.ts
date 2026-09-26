import {
  Body,
  Controller,
  Delete,
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
import { CommunityGatewayService } from './community.service.js';
import {
  CreateComplaintDto,
  CreateNoticeDto,
  CreateVisitorDto,
  UpdateComplaintDto,
  UpdateNoticeDto,
  UpdateVisitorDto,
} from './dto/community.dto.js';

@ApiTags('community')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CommunityController {
  constructor(private readonly community: CommunityGatewayService) {}

  @Post('notices')
  @RequirePermissions('manage:notice')
  createNotice(@Body() dto: CreateNoticeDto) {
    return this.community.createNotice(
      dto as unknown as Record<string, unknown>,
    );
  }

  @Get('notices')
  @RequirePermissions('view:notice')
  listNotices(
    @Query('societyId', ParseUUIDPipe) societyId: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.community.listNotices(societyId, activeOnly === 'true');
  }

  @Get('notices/:uid')
  @RequirePermissions('view:notice')
  getNotice(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.community.getNotice(uid);
  }

  @Patch('notices/:uid')
  @RequirePermissions('manage:notice')
  updateNotice(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateNoticeDto,
  ) {
    return this.community.updateNotice(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Delete('notices/:uid')
  @RequirePermissions('manage:notice')
  deleteNotice(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.community.deleteNotice(uid);
  }

  @Post('complaints')
  @RequirePermissions('create:complaint')
  createComplaint(@Body() dto: CreateComplaintDto) {
    return this.community.createComplaint(
      dto as unknown as Record<string, unknown>,
    );
  }

  @Get('complaints')
  @RequirePermissions('view:complaint')
  listComplaints(
    @Query('societyId', ParseUUIDPipe) societyId: string,
    @Query('status') status?: string,
  ) {
    return this.community.listComplaints(societyId, status);
  }

  @Get('complaints/:uid')
  @RequirePermissions('view:complaint')
  getComplaint(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.community.getComplaint(uid);
  }

  @Patch('complaints/:uid')
  @RequirePermissions('manage:complaint')
  updateComplaint(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateComplaintDto,
  ) {
    return this.community.updateComplaint(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('visitors')
  @RequirePermissions('manage:visitor')
  createVisitor(@Body() dto: CreateVisitorDto) {
    return this.community.createVisitor(
      dto as unknown as Record<string, unknown>,
    );
  }

  @Get('visitors')
  @RequirePermissions('view:visitor')
  listVisitors(
    @Query('societyId', ParseUUIDPipe) societyId: string,
    @Query('status') status?: string,
  ) {
    return this.community.listVisitors(societyId, status);
  }

  @Get('visitors/:uid')
  @RequirePermissions('view:visitor')
  getVisitor(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.community.getVisitor(uid);
  }

  @Patch('visitors/:uid')
  @RequirePermissions('manage:visitor')
  updateVisitor(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateVisitorDto,
  ) {
    return this.community.updateVisitor(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Post('visitors/:uid/check-in')
  @RequirePermissions('manage:visitor')
  checkIn(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.community.checkIn(uid);
  }

  @Post('visitors/:uid/check-out')
  @RequirePermissions('manage:visitor')
  checkOut(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.community.checkOut(uid);
  }

  @Post('visitors/:uid/cancel')
  @RequirePermissions('manage:visitor')
  cancelVisitor(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.community.cancelVisitor(uid);
  }
}
