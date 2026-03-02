import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CvStatus,
  Prisma,
  ReportStatus,
  ReportTargetType,
  UserStatus,
} from '@prisma/client';

import { CreateReportDto } from './dto/create-report.dto';
import { ListModerationReportsQueryDto } from './dto/list-moderation-reports-query.dto';
import { ResolveReportDto } from './dto/resolve-report.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(reporterUserId: string, dto: CreateReportDto) {
    if (dto.targetType === ReportTargetType.CV) {
      const cv = await this.prisma.cV.findUnique({
        where: {
          id: dto.targetId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      if (!cv) {
        throw new NotFoundException('CV not found');
      }
    } else {
      const user = await this.prisma.user.findUnique({
        where: {
          id: dto.targetId,
        },
        select: {
          id: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    const existingOpenReport = await this.prisma.report.findFirst({
      where: {
        reporterUserId,
        targetType: dto.targetType as ReportTargetType,
        targetId: dto.targetId,
        status: ReportStatus.OPEN,
      },
      select: {
        id: true,
      },
    });

    if (existingOpenReport) {
      throw new BadRequestException('You already reported this target');
    }

    return this.prisma.report.create({
      data: {
        reporterUserId,
        targetType: dto.targetType as ReportTargetType,
        targetId: dto.targetId,
        reason: dto.reason.trim(),
      },
      select: {
        id: true,
        targetType: true,
        targetId: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async getReports(query: ListModerationReportsQueryDto) {
    const where: Prisma.ReportWhereInput = {};

    if (query.status) {
      where.status = query.status as ReportStatus;
    }

    if (query.targetType) {
      where.targetType = query.targetType as ReportTargetType;
    }

    const reports = await this.prisma.report.findMany({
      where,
      select: {
        id: true,
        reporterUserId: true,
        targetType: true,
        targetId: true,
        reason: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        reporter: {
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });

    const cvIds = reports
      .filter((report) => report.targetType === ReportTargetType.CV)
      .map((report) => report.targetId);
    const userIds = reports
      .filter((report) => report.targetType === ReportTargetType.USER)
      .map((report) => report.targetId);

    const [cvs, users] = await Promise.all([
      cvIds.length
        ? this.prisma.cV.findMany({
            where: {
              id: {
                in: cvIds,
              },
            },
            select: {
              id: true,
              title: true,
              status: true,
              fileType: true,
              category: {
                select: {
                  id: true,
                  nameFr: true,
                  nameEn: true,
                  slug: true,
                },
              },
              owner: {
                select: {
                  id: true,
                  email: true,
                  status: true,
                  profile: {
                    select: {
                      fullName: true,
                    },
                  },
                },
              },
            },
          })
        : Promise.resolve([]),
      userIds.length
        ? this.prisma.user.findMany({
            where: {
              id: {
                in: userIds,
              },
            },
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
              profile: {
                select: {
                  fullName: true,
                  country: true,
                  city: true,
                  phone: true,
                  headline: true,
                },
              },
            },
          })
        : Promise.resolve([]),
    ]);

    const cvMap = new Map(cvs.map((cv) => [cv.id, cv]));
    const userMap = new Map(users.map((user) => [user.id, user]));

    const items = reports.map((report) => ({
      id: report.id,
      reason: report.reason,
      status: report.status,
      createdAt: report.createdAt,
      resolvedAt: report.resolvedAt,
      targetType: report.targetType,
      targetId: report.targetId,
      reporter: {
        id: report.reporter.id,
        email: report.reporter.email,
        role: report.reporter.role,
        status: report.reporter.status,
        fullName: report.reporter.profile?.fullName ?? null,
      },
      targetCv:
        report.targetType === ReportTargetType.CV
          ? (() => {
              const targetCv = cvMap.get(report.targetId);

              if (!targetCv) {
                return null;
              }

              return {
                id: targetCv.id,
                title: targetCv.title,
                status: targetCv.status,
                fileType: targetCv.fileType,
                category: targetCv.category,
                owner: {
                  id: targetCv.owner.id,
                  email: targetCv.owner.email,
                  status: targetCv.owner.status,
                  fullName: targetCv.owner.profile?.fullName ?? null,
                },
              };
            })()
          : null,
      targetUser:
        report.targetType === ReportTargetType.USER
          ? (() => {
              const targetUser = userMap.get(report.targetId);

              if (!targetUser) {
                return null;
              }

              return {
                id: targetUser.id,
                email: targetUser.email,
                role: targetUser.role,
                status: targetUser.status,
                profile: targetUser.profile
                  ? {
                      fullName: targetUser.profile.fullName,
                      country: targetUser.profile.country,
                      city: targetUser.profile.city,
                      phone: targetUser.profile.phone,
                      headline: targetUser.profile.headline,
                    }
                  : null,
              };
            })()
          : null,
    }));

    return {
      summary: {
        total: items.length,
        open: items.filter((item) => item.status === ReportStatus.OPEN).length,
        resolved: items.filter((item) => item.status === ReportStatus.RESOLVED).length,
        rejected: items.filter((item) => item.status === ReportStatus.REJECTED).length,
        cvTargets: items.filter((item) => item.targetType === ReportTargetType.CV).length,
        userTargets: items.filter((item) => item.targetType === ReportTargetType.USER).length,
      },
      items,
    };
  }

  async resolveReport(reportId: string, dto: ResolveReportDto) {
    const report = await this.prisma.report.findUnique({
      where: {
        id: reportId,
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== ReportStatus.OPEN) {
      throw new BadRequestException('This report is already processed');
    }

    const nextStatus =
      dto.status === 'REJECTED' ? ReportStatus.REJECTED : ReportStatus.RESOLVED;

    return this.prisma.report.update({
      where: {
        id: reportId,
      },
      data: {
        status: nextStatus,
        resolvedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        resolvedAt: true,
      },
    });
  }

  async hideCv(cvId: string) {
    const cv = await this.prisma.cV.findUnique({
      where: {
        id: cvId,
      },
      select: {
        id: true,
        status: true,
        title: true,
      },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    if (cv.status === CvStatus.DELETED) {
      throw new BadRequestException('This CV is deleted and cannot be hidden');
    }

    const updatedCv =
      cv.status === CvStatus.HIDDEN
        ? cv
        : await this.prisma.cV.update({
            where: {
              id: cvId,
            },
            data: {
              status: CvStatus.HIDDEN,
            },
            select: {
              id: true,
              status: true,
              title: true,
            },
          });

    return {
      cv: updatedCv,
      previousStatus: cv.status,
    };
  }

  async banUser(actorUserId: string, userId: string) {
    if (actorUserId === userId) {
      throw new BadRequestException('You cannot ban your own account');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        status: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = await this.prisma.$transaction(async (transaction) => {
      const updatedUser =
        user.status === UserStatus.BANNED
          ? user
          : await transaction.user.update({
              where: {
                id: userId,
              },
              data: {
                status: UserStatus.BANNED,
              },
              select: {
                id: true,
                email: true,
                status: true,
                role: true,
              },
            });

      const hiddenCvResult = await transaction.cV.updateMany({
        where: {
          userId,
          status: {
            in: [CvStatus.ACTIVE, CvStatus.DRAFT],
          },
        },
        data: {
          status: CvStatus.HIDDEN,
        },
      });

      return {
        user: updatedUser,
        hiddenCvCount: hiddenCvResult.count,
      };
    });

    return {
      ...result,
      previousStatus: user.status,
    };
  }
}
