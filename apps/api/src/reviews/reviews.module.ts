import { Module } from '@nestjs/common';

import { ProfileCompleteGuard } from '../common/guards/profile-complete.guard';
import { ReviewRequestsController } from './review-requests.controller';
import { RhController } from './rh.controller';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [ReviewRequestsController, RhController],
  providers: [ReviewsService, ProfileCompleteGuard],
})
export class ReviewsModule {}
