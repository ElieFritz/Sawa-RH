import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ProfileCompleteGuard } from '../common/guards/profile-complete.guard';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CreateReviewRequestDto } from './dto/create-review-request.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Review Requests')
@ApiBearerAuth()
@Controller('review-requests')
export class ReviewRequestsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Roles(UserRole.CANDIDATE, UserRole.ADMIN)
  @UseGuards(ProfileCompleteGuard)
  @ApiOkResponse()
  createReviewRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateReviewRequestDto,
  ) {
    return this.reviewsService.createReviewRequest(user, dto);
  }

  @Get('me')
  @Roles(UserRole.CANDIDATE, UserRole.ADMIN)
  @ApiOkResponse()
  getMyReviewRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.reviewsService.getMyReviewRequests(user.id);
  }
}
