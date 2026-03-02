import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { Roles } from '../common/decorators/roles.decorator';
import { CreateJobCategoryDto } from './dto/create-job-category.dto';
import { UpdateJobCategoryDto } from './dto/update-job-category.dto';
import { JobCategoriesService } from './job-categories.service';

@ApiTags('Admin Categories')
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.MODERATOR)
@Controller('admin/categories')
export class AdminJobCategoriesController {
  constructor(private readonly jobCategoriesService: JobCategoriesService) {}

  @Get()
  @ApiOkResponse()
  getAllCategories() {
    return this.jobCategoriesService.getAllCategories();
  }

  @Post()
  @ApiOkResponse()
  createCategory(@Body() dto: CreateJobCategoryDto) {
    return this.jobCategoriesService.createCategory(dto);
  }

  @Patch(':categoryId')
  @ApiOkResponse()
  updateCategory(
    @Param('categoryId', new ParseUUIDPipe()) categoryId: string,
    @Body() dto: UpdateJobCategoryDto,
  ) {
    return this.jobCategoriesService.updateCategory(categoryId, dto);
  }

  @Delete(':categoryId')
  @ApiOkResponse()
  removeCategory(@Param('categoryId', new ParseUUIDPipe()) categoryId: string) {
    return this.jobCategoriesService.removeCategory(categoryId);
  }
}
