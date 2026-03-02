import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateReviewRequestDto {
  @ApiProperty()
  @IsUUID()
  cvId!: string;
}
