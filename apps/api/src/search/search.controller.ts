import { Controller, Get, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';
import type { Request } from 'express';

import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { SearchCvsQueryDto } from './dto/search-cvs-query.dto';
import { SearchService } from './search.service';

@ApiTags('Search')
@ApiBearerAuth()
@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly auditService: AuditService,
  ) {}

  @Get('cvs')
  @ApiOkResponse()
  async searchCvs(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchCvsQueryDto,
    @Req() request: Request,
  ) {
    const result = await this.searchService.searchCvs(user, query);

    await this.auditService.log(
      {
        actorUserId: user.id,
        action: AuditAction.SEARCH_CV,
        targetType: 'CV_SEARCH',
        metadata: {
          query: query.query ?? null,
          category: query.category ?? null,
          country: query.country ?? null,
          city: query.city ?? null,
          expMin: query.expMin ?? null,
          expMax: query.expMax ?? null,
          page: query.page,
          pageSize: query.pageSize,
          sort: query.sort,
          total: result.total,
        },
      },
      request,
    );

    return result;
  }
}
