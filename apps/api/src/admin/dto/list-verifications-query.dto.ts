import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import {
  verificationQueueRoleValues,
  verificationStatusValues,
  type VerificationQueueRole,
  type VerificationStatus,
} from '@sawa-rh/shared';

export class ListVerificationsQueryDto {
  @ApiPropertyOptional({
    enum: verificationQueueRoleValues,
  })
  @IsOptional()
  @IsIn(verificationQueueRoleValues)
  role?: VerificationQueueRole;

  @ApiPropertyOptional({
    enum: verificationStatusValues,
    default: 'PENDING_REVIEW',
  })
  @IsOptional()
  @IsIn(verificationStatusValues)
  status?: VerificationStatus;
}
