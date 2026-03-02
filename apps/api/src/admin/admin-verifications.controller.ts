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
import { AdminDecisionNoteDto } from './dto/admin-decision-note.dto';
import { ListVerificationsQueryDto } from './dto/list-verifications-query.dto';
import { AdminVerificationsService } from './admin-verifications.service';

@ApiTags('Admin Verifications')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/verifications')
export class AdminVerificationsController {
  constructor(
    private readonly adminVerificationsService: AdminVerificationsService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  @ApiOkResponse()
  getPendingVerifications(@Query() query: ListVerificationsQueryDto) {
    return this.adminVerificationsService.getPendingVerifications(query);
  }

  @Post(':userId/approve')
  @ApiOkResponse()
  async approveVerification(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: AdminDecisionNoteDto,
    @Req() request: Request,
  ) {
    const result = await this.adminVerificationsService.approveVerification({
      actorUserId: actor.id,
      userId,
      note: dto.note,
    });

    await this.auditService.log(
      {
        actorUserId: actor.id,
        action: AuditAction.APPROVE_VERIFICATION,
        targetType: 'USER',
        targetId: userId,
        metadata: {
          decision: 'APPROVED',
          role: result.user.role,
          note: dto.note ?? null,
        },
      },
      request,
    );

    return result;
  }

  @Post(':userId/reject')
  @ApiOkResponse()
  async rejectVerification(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() dto: AdminDecisionNoteDto,
    @Req() request: Request,
  ) {
    const result = await this.adminVerificationsService.rejectVerification({
      actorUserId: actor.id,
      userId,
      note: dto.note,
    });

    await this.auditService.log(
      {
        actorUserId: actor.id,
        action: AuditAction.APPROVE_VERIFICATION,
        targetType: 'USER',
        targetId: userId,
        metadata: {
          decision: 'REJECTED',
          role: result.user.role,
          note: dto.note ?? null,
        },
      },
      request,
    );

    return result;
  }
}
