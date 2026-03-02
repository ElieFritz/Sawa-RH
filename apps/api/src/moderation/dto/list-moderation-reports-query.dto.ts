import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import {
  reportStatusValues,
  reportTargetTypeValues,
  type ReportStatus,
  type ReportTargetType,
} from '@sawa-rh/shared';

export class ListModerationReportsQueryDto {
  @ApiPropertyOptional({
    enum: reportStatusValues,
  })
  @IsOptional()
  @IsIn(reportStatusValues)
  status?: ReportStatus;

  @ApiPropertyOptional({
    enum: reportTargetTypeValues,
  })
  @IsOptional()
  @IsIn(reportTargetTypeValues)
  targetType?: ReportTargetType;
}
