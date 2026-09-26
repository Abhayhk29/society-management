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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { CoreSocietyService } from './core-society.service.js';
import { CreateMembershipDto, UpdateMembershipDto } from './dto/society.dto.js';

@ApiTags('society')
@ApiBearerAuth('access-token')
@Controller('memberships')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MembershipsController {
  constructor(private readonly coreSociety: CoreSocietyService) {}

  @Post()
  @RequirePermissions('manage:membership')
  create(@Body() dto: CreateMembershipDto) {
    return this.coreSociety.createMembership(
      dto as unknown as Record<string, unknown>,
    );
  }

  @Get(':uid')
  @RequirePermissions('view:membership')
  findOne(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreSociety.getMembership(uid);
  }

  @Patch(':uid')
  @RequirePermissions('manage:membership')
  update(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Body() dto: UpdateMembershipDto,
  ) {
    return this.coreSociety.updateMembership(
      uid,
      dto as unknown as Record<string, unknown>,
    );
  }

  @Delete(':uid')
  @RequirePermissions('manage:membership')
  remove(@Param('uid', ParseUUIDPipe) uid: string) {
    return this.coreSociety.deleteMembership(uid);
  }
}
