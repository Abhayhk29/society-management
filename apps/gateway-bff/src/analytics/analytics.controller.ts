import {
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/permissions.guard.js';
import { RequirePermissions } from '../auth/require-permissions.decorator.js';
import { AnalyticsGatewayService } from './analytics.service.js';

@ApiTags('analytics')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsGatewayService) {}

  @Get('receipts/:uid/pdf')
  @RequirePermissions('view:bills')
  @ApiTags('billing')
  @ApiOperation({ summary: 'Download receipt PDF (via analytics)' })
  @ApiProduces('application/pdf')
  async receiptPdf(
    @Param('uid', ParseUUIDPipe) uid: string,
    @Res() res: Response,
  ) {
    const { pdfBytes, filename, contentType } =
      await this.analytics.receiptPdfById(uid);
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename.replace(/"/g, '')}"`,
    );
    res.send(pdfBytes);
  }

  @Get('analytics/insights/:societyId')
  @RequirePermissions('view:analytics')
  @Header('Content-Type', 'application/json')
  societyInsights(@Param('societyId', ParseUUIDPipe) societyId: string) {
    return this.analytics.societyInsights(societyId);
  }
}
