import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuditAction, UserRole } from '@prisma/client';
import type { Request } from 'express';

import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { SubmitReviewDto } from './dto/submit-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('RH Reviews')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.RH_PRO)
@Controller('rh')
export class RhController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly auditService: AuditService,
  ) {}

  @Get('queue')
  @ApiOkResponse()
  getQueue(@CurrentUser() user: AuthenticatedUser) {
    return this.reviewsService.getRhQueue(user);
  }

  @Get('requests/:id')
  @ApiOkResponse()
  getRhRequestDetail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) requestId: string,
  ) {
    return this.reviewsService.getRhRequestDetail(user, requestId);
  }

  @Post('requests/:id/assign')
  @ApiOkResponse()
  async assignRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) requestId: string,
    @Req() request: Request,
  ) {
    const result = await this.reviewsService.assignRequest(user, requestId);

    await this.auditService.log(
      {
        actorUserId: user.id,
        action: AuditAction.ASSIGN_REQUEST,
        targetType: 'REVIEW_REQUEST',
        targetId: requestId,
      },
      request,
    );

    return result;
  }

  @Post('requests/:id/submit')
  @ApiOkResponse()
  async submitReview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', new ParseUUIDPipe()) requestId: string,
    @Body() dto: SubmitReviewDto,
    @Req() request: Request,
  ) {
    const result = await this.reviewsService.submitReview(user, requestId, dto);

    await this.auditService.log(
      {
        actorUserId: user.id,
        action: AuditAction.SUBMIT_REVIEW,
        targetType: 'REVIEW_REQUEST',
        targetId: requestId,
      },
      request,
    );

    return result;
  }
}
