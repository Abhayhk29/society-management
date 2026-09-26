import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import {
  CreateMembershipDto,
  UpdateMembershipDto,
} from './dto/membership.dto.js';
import { MembershipsService } from './memberships.service.js';

@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Post('memberships')
  @RequirePermissions('manage:membership')
  create(@Body() dto: CreateMembershipDto) {
    return this.membershipsService.create(dto);
  }

  @Get('societies/:societyId/memberships')
  @RequirePermissions('view:membership')
  findBySociety(@Param('societyId', ParseUUIDPipe) societyId: string) {
    return this.membershipsService.findBySociety(societyId);
  }

  @Get('users/:userId/memberships')
  @RequirePermissions('view:membership')
  findByUser(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.membershipsService.findByUser(userId);
  }

  @Get('memberships/:uid')
  @RequirePermissions('view:membership')
  findOne(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.membershipsService.findOne(uid);
  }

  @Patch('memberships/:uid')
  @RequirePermissions('manage:membership')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateMembershipDto,
  ) {
    return this.membershipsService.update(uid, dto);
  }

  @Delete('memberships/:uid')
  @RequirePermissions('manage:membership')
  remove(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.membershipsService.remove(uid);
  }
}
