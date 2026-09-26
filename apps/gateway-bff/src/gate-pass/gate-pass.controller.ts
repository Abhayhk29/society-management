import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import {
  CreateGatePassDto,
  RejectGatePassDto,
  VerifyQrDto,
} from './dto/gate-pass.dto.js';
import { GatePassService } from './gate-pass.service.js';

@ApiTags('gate-passes')
@ApiBearerAuth('access-token')
@Controller('gate-passes')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GatePassController {
  constructor(private readonly gatePasses: GatePassService) {}

  @Post()
  @RequirePermissions('create:gate_pass')
  create(@Body() dto: CreateGatePassDto) {
    return this.gatePasses.create(dto as unknown as Record<string, unknown>);
  }

  @Get()
  @RequirePermissions('view:gate_pass')
  list(
    @Query('societyId', ParseUUIDPipe) societyId: string,
    @Query('status') status?: string,
  ) {
    return this.gatePasses.list(societyId, status);
  }

  @Post('verify-qr')
  @RequirePermissions('approve:gate_pass')
  verifyQr(@Body() dto: VerifyQrDto) {
    return this.gatePasses.verifyQr(dto.qrPayload);
  }

  @Get(':uid')
  @RequirePermissions('view:gate_pass')
  get(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.gatePasses.get(uid);
  }

  @Post(':uid/approve')
  @RequirePermissions('approve:gate_pass')
  approve(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.gatePasses.approve(uid);
  }

  @Post(':uid/reject')
  @RequirePermissions('approve:gate_pass')
  reject(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: RejectGatePassDto,
  ) {
    return this.gatePasses.reject(uid, dto.reason);
  }

  @Post(':uid/cancel')
  @RequirePermissions('create:gate_pass')
  cancel(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.gatePasses.cancel(uid);
  }
}
