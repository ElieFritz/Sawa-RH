import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

import { JobCategoriesService } from './job-categories.service';

@ApiTags('Job Categories')
@ApiBearerAuth()
@Controller('job-categories')
export class JobCategoriesController {
  constructor(private readonly jobCategoriesService: JobCategoriesService) {}

  @Public()
  @Get('active')
  @ApiOkResponse()
  getActiveCategories() {
    return this.jobCategoriesService.getActiveCategories();
  }
}
