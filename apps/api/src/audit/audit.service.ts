import { Injectable } from '@nestjs/common';
import { AuditAction, Prisma } from '@prisma/client';
import type { Request } from 'express';

import { PrismaService } from '../prisma/prisma.service';

type CreateAuditLogInput = {
  actorUserId?: string | null;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: CreateAuditLogInput, request?: Request) {
    const userAgentHeader = request?.headers['user-agent'];

    return this.prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        metadata: input.metadata,
        ip: request?.ip ?? null,
        userAgent:
          typeof userAgentHeader === 'string' ? userAgentHeader : userAgentHeader?.[0] ?? null,
      },
    });
  }
}
