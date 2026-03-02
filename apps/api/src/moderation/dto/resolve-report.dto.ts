import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

const resolvableReportStatuses = ['RESOLVED', 'REJECTED'] as const;

type ResolvableReportStatus = (typeof resolvableReportStatuses)[number];

export class ResolveReportDto {
  @ApiPropertyOptional({
    enum: resolvableReportStatuses,
    default: 'RESOLVED',
  })
  @IsOptional()
  @IsIn(resolvableReportStatuses)
  status?: ResolvableReportStatus;
}
