import { ApiPropertyOptional } from '@nestjs/swagger';
import { CvStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdateCvDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    enum: [CvStatus.ACTIVE, CvStatus.HIDDEN],
  })
  @IsOptional()
  @IsEnum(CvStatus)
  status?: CvStatus;
}
