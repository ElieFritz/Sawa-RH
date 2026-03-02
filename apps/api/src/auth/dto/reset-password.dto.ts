import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({
    minLength: 8,
    description: 'At least 8 chars, one upper, one lower, one number',
  })
  @IsString()
  @MinLength(8)
  @Matches(/[A-Z]/)
  @Matches(/[a-z]/)
  @Matches(/\d/)
  password!: string;
}
