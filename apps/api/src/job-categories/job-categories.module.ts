import { Module } from '@nestjs/common';

import { AdminJobCategoriesController } from './admin-job-categories.controller';
import { JobCategoriesController } from './job-categories.controller';
import { JobCategoriesService } from './job-categories.service';

@Module({
  controllers: [JobCategoriesController, AdminJobCategoriesController],
  providers: [JobCategoriesService],
  exports: [JobCategoriesService],
})
export class JobCategoriesModule {}
