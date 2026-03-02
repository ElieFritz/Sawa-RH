import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class SubmitReviewDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  scoreAts!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  scoreReadability!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  scoreConsistency!: number;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  globalNote!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  sectionProfile!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  sectionExperience!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(3000)
  sectionSkills!: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  suggestions!: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  recommendedTemplate!: string;
}
