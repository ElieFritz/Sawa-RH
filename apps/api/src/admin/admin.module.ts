import { Module } from '@nestjs/common';

import { AdminVerificationsController } from './admin-verifications.controller';
import { AdminVerificationsService } from './admin-verifications.service';

@Module({
  controllers: [AdminVerificationsController],
  providers: [AdminVerificationsService],
})
export class AdminModule {}
