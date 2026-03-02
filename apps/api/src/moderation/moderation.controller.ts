import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuditAction, UserRole } from '@prisma/client';
import type { Request } from 'express';

import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { ListModerationReportsQueryDto } from './dto/list-moderation-reports-query.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { ModerationService } from './moderation.service';

@ApiTags('Moderation')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@Controller('moderation')
export class ModerationController {
  constructor(
    private readonly moderationService: ModerationService,
    private readonly auditService: AuditService,
  ) {}

  @Get('reports')
  @ApiOkResponse()
  getReports(@Query() query: ListModerationReportsQueryDto) {
    return this.moderationService.getReports(query);
  }

  @Post('reports/:id/resolve')
  @ApiOkResponse()
  resolveReport(
    @Param('id', new ParseUUIDPipe()) reportId: string,
    @Body() dto: ResolveReportDto,
  ) {
    return this.moderationService.resolveReport(reportId, dto);
  }

  @Post('cvs/:id/hide')
  @ApiOkResponse()
  async hideCv(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) cvId: string,
    @Req() request: Request,
  ) {
    const result = await this.moderationService.hideCv(cvId);

    await this.auditService.log(
      {
        actorUserId: user.id,
        action: AuditAction.HIDE_CV,
        targetType: 'CV',
        targetId: cvId,
        metadata: {
          source: 'MODERATION',
          previousStatus: result.previousStatus,
          nextStatus: result.cv.status,
        },
      },
      request,
    );

    return result;
  }

  @Post('users/:id/ban')
  @ApiOkResponse()
  async banUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) userId: string,
    @Req() request: Request,
  ) {
    const result = await this.moderationService.banUser(user.id, userId);

    await this.auditService.log(
      {
        actorUserId: user.id,
        action: AuditAction.BAN_USER,
        targetType: 'USER',
        targetId: userId,
        metadata: {
          source: 'MODERATION',
          previousStatus: result.previousStatus,
          nextStatus: result.user.status,
          hiddenCvCount: result.hiddenCvCount,
        },
      },
      request,
    );

    return result;
  }
}
