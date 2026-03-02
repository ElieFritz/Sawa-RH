import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

import {
  reportTargetTypeValues,
  type ReportTargetType,
} from '@sawa-rh/shared';

export class CreateReportDto {
  @ApiProperty({
    enum: reportTargetTypeValues,
  })
  @IsIn(reportTargetTypeValues)
  targetType!: ReportTargetType;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  targetId!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason!: string;
}
