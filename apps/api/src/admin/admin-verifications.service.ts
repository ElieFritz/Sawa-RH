import { BadRequestException, Injectable } from '@nestjs/common';
import {
  AuditAction,
  Prisma,
  ProfileCompletionStatus,
  UserRole,
  VerificationStatus,
} from '@prisma/client';

import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ListVerificationsQueryDto } from './dto/list-verifications-query.dto';

const verificationRoles = new Set<UserRole>([UserRole.RH_PRO, UserRole.RECRUITER]);
const pendingVerificationRoles: UserRole[] = [UserRole.RH_PRO, UserRole.RECRUITER];

type VerificationDecisionInput = {
  actorUserId: string;
  userId: string;
  note?: string;
};

type VerificationDecisionSummary = {
  decidedAt: Date;
  decision: 'APPROVED' | 'REJECTED' | null;
  note: string | null;
  actor: {
    id: string;
    email: string;
    fullName: string | null;
  } | null;
};

type ParsedDecisionMetadata = Pick<VerificationDecisionSummary, 'decision' | 'note'>;

@Injectable()
export class AdminVerificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async getPendingVerifications(query: ListVerificationsQueryDto) {
    const roles = query.role ? [query.role as UserRole] : pendingVerificationRoles;
    const status = (query.status as VerificationStatus | undefined) ?? VerificationStatus.PENDING_REVIEW;

    const users = await this.prisma.user.findMany({
      where: {
        role: {
          in: roles,
        },
        profile: {
          is: {
            completionStatus: ProfileCompletionStatus.COMPLETE,
            verificationStatus: status,
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: {
          select: {
            fullName: true,
            country: true,
            city: true,
            phone: true,
            headline: true,
            yearsExperience: true,
            completionStatus: true,
            verificationStatus: true,
            verifiedBadge: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const reviewDecisionMap = await this.getLatestVerificationDecisions(
      users.map((user) => user.id),
    );

    return users.map((user) => ({
      ...user,
      reviewDecision: reviewDecisionMap.get(user.id) ?? null,
    }));
  }

  async approveVerification(input: VerificationDecisionInput) {
    const user = await this.assertVerifiableUser(input.userId);

    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        profile: {
          update: {
            completionStatus: ProfileCompletionStatus.COMPLETE,
            verificationStatus: VerificationStatus.APPROVED,
            verifiedBadge: user.role === UserRole.RH_PRO,
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            completionStatus: true,
            verificationStatus: true,
            verifiedBadge: true,
          },
        },
      },
    });

    await this.mailService.sendVerificationDecisionEmail(updatedUser.email, 'APPROVED');

    return {
      user: updatedUser,
      moderation: {
        decidedBy: input.actorUserId,
        note: input.note ?? null,
      },
    };
  }

  async rejectVerification(input: VerificationDecisionInput) {
    const user = await this.assertVerifiableUser(input.userId);

    const updatedUser = await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        profile: {
          update: {
            completionStatus: ProfileCompletionStatus.COMPLETE,
            verificationStatus: VerificationStatus.REJECTED,
            verifiedBadge: false,
          },
        },
      },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            completionStatus: true,
            verificationStatus: true,
            verifiedBadge: true,
          },
        },
      },
    });

    await this.mailService.sendVerificationDecisionEmail(updatedUser.email, 'REJECTED');

    return {
      user: updatedUser,
      moderation: {
        decidedBy: input.actorUserId,
        note: input.note ?? null,
      },
    };
  }

  private async assertVerifiableUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            completionStatus: true,
            verificationStatus: true,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!verificationRoles.has(user.role)) {
      throw new BadRequestException('This user role is not subject to admin verification');
    }

    if (!user.profile) {
      throw new BadRequestException('Profile not found');
    }

    if (user.profile.completionStatus !== ProfileCompletionStatus.COMPLETE) {
      throw new BadRequestException('Profile must be complete before review');
    }

    if (user.profile.verificationStatus !== VerificationStatus.PENDING_REVIEW) {
      throw new BadRequestException('This verification request is not pending');
    }

    return user;
  }

  private async getLatestVerificationDecisions(
    userIds: string[],
  ): Promise<Map<string, VerificationDecisionSummary>> {
    if (!userIds.length) {
      return new Map<string, VerificationDecisionSummary>();
    }

    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: AuditAction.APPROVE_VERIFICATION,
        targetType: 'USER',
        targetId: {
          in: userIds,
        },
      },
      select: {
        targetId: true,
        createdAt: true,
        metadata: true,
        actor: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const latestByTarget = new Map<string, VerificationDecisionSummary>();

    for (const log of logs) {
      if (!log.targetId || latestByTarget.has(log.targetId)) {
        continue;
      }

      const metadata = this.parseDecisionMetadata(log.metadata);

      latestByTarget.set(log.targetId, {
        decidedAt: log.createdAt,
        decision: metadata.decision,
        note: metadata.note,
        actor: log.actor
          ? {
              id: log.actor.id,
              email: log.actor.email,
              fullName: log.actor.profile?.fullName ?? null,
            }
          : null,
      });
    }

    return latestByTarget;
  }

  private parseDecisionMetadata(
    metadata: Prisma.JsonValue | null,
  ): ParsedDecisionMetadata {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
      return {
        decision: null,
        note: null,
      };
    }

    const value = metadata as Record<string, unknown>;
    const rawDecision = value.decision;
    const rawNote = value.note;

    return {
      decision:
        rawDecision === 'APPROVED' || rawDecision === 'REJECTED'
          ? (rawDecision as ParsedDecisionMetadata['decision'])
          : null,
      note: typeof rawNote === 'string' ? rawNote : null,
    };
  }
}
