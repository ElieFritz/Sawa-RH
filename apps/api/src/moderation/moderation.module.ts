import { Module } from '@nestjs/common';

import { ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { ReportsController } from './reports.controller';

@Module({
  controllers: [ModerationController, ReportsController],
  providers: [ModerationService],
})
export class ModerationModule {}
