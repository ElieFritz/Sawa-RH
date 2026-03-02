import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { IsEmail, IsIn, IsString, Matches, MinLength } from 'class-validator';

import { localeValues, selfServeRoleValues } from '@sawa-rh/shared';

export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

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

  @ApiProperty({
    enum: selfServeRoleValues,
  })
  @IsIn(selfServeRoleValues)
  role!: UserRole;

  @ApiProperty({
    enum: localeValues,
    default: 'fr',
  })
  @IsIn(localeValues)
  locale: (typeof localeValues)[number] = 'fr';
}
