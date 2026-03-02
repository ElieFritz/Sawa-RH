import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { localeValues } from '@sawa-rh/shared';

export class UpdateProfileDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  country!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  city!: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  phone!: string;

  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  headline!: string;

  @ApiProperty({
    minimum: 0,
    maximum: 60,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  yearsExperience!: number;

  @ApiProperty({
    enum: localeValues,
  })
  @IsIn(localeValues)
  locale!: (typeof localeValues)[number];
}
