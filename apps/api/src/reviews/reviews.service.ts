import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CvStatus,
  ReviewRequestStatus,
  UserRole,
  VerificationStatus,
} from '@prisma/client';

import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { CreateReviewRequestDto } from './dto/create-review-request.dto';
import { SubmitReviewDto } from './dto/submit-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async createReviewRequest(
    user: AuthenticatedUser,
    dto: CreateReviewRequestDto,
  ) {
    const cv = await this.prisma.cV.findFirst({
      where: {
        id: dto.cvId,
        userId: user.id,
        status: CvStatus.ACTIVE,
      },
      select: {
        id: true,
      },
    });

    if (!cv) {
      throw new BadRequestException('You can only request a review for one of your active CVs');
    }

    const activeExistingRequest = await this.prisma.reviewRequest.findFirst({
      where: {
        cvId: dto.cvId,
        candidateId: user.id,
        status: {
          in: [ReviewRequestStatus.OPEN, ReviewRequestStatus.ASSIGNED],
        },
      },
      select: {
        id: true,
      },
    });

    if (activeExistingRequest) {
      throw new BadRequestException('A review request is already in progress for this CV');
    }

    return this.prisma.reviewRequest.create({
      data: {
        cvId: dto.cvId,
        candidateId: user.id,
        status: ReviewRequestStatus.OPEN,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async getMyReviewRequests(userId: string) {
    return this.prisma.reviewRequest.findMany({
      where: {
        candidateId: userId,
      },
      select: {
        id: true,
        status: true,
        assignedRhId: true,
        createdAt: true,
        updatedAt: true,
        cv: {
          select: {
            id: true,
            title: true,
            fileType: true,
            category: {
              select: {
                id: true,
                nameFr: true,
                nameEn: true,
                slug: true,
              },
            },
          },
        },
        assignedRh: {
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
        review: {
          select: {
            id: true,
            scoreAts: true,
            scoreReadability: true,
            scoreConsistency: true,
            globalNote: true,
            sectionProfile: true,
            sectionExperience: true,
            sectionSkills: true,
            suggestions: true,
            recommendedTemplate: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getRhQueue(user: AuthenticatedUser) {
    this.assertRhAccess(user);

    const [openRequests, myAssignedRequests] = await Promise.all([
      this.prisma.reviewRequest.findMany({
        where: {
          status: ReviewRequestStatus.OPEN,
          assignedRhId: null,
        },
        select: this.rhQueueSelect(),
        orderBy: {
          createdAt: 'asc',
        },
      }),
      this.prisma.reviewRequest.findMany({
        where: {
          status: ReviewRequestStatus.ASSIGNED,
          assignedRhId: user.id,
        },
        select: this.rhQueueSelect(),
        orderBy: {
          updatedAt: 'desc',
        },
      }),
    ]);

    return {
      openRequests,
      myAssignedRequests,
    };
  }

  async getRhRequestDetail(user: AuthenticatedUser, requestId: string) {
    this.assertRhAccess(user);

    const request = await this.prisma.reviewRequest.findUnique({
      where: {
        id: requestId,
      },
      select: {
        id: true,
        status: true,
        assignedRhId: true,
        createdAt: true,
        updatedAt: true,
        candidate: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                country: true,
                city: true,
                phone: true,
                headline: true,
                yearsExperience: true,
              },
            },
          },
        },
        cv: {
          select: {
            id: true,
            title: true,
            fileType: true,
            searchableText: true,
            category: {
              select: {
                id: true,
                nameFr: true,
                nameEn: true,
                slug: true,
              },
            },
          },
        },
        review: {
          select: {
            id: true,
            scoreAts: true,
            scoreReadability: true,
            scoreConsistency: true,
            globalNote: true,
            sectionProfile: true,
            sectionExperience: true,
            sectionSkills: true,
            suggestions: true,
            recommendedTemplate: true,
            createdAt: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Review request not found');
    }

    const canRead =
      request.status === ReviewRequestStatus.OPEN ||
      request.assignedRhId === user.id ||
      user.role === UserRole.ADMIN;

    if (!canRead) {
      throw new ForbiddenException('This review request is not assigned to you');
    }

    return request;
  }

  async assignRequest(user: AuthenticatedUser, requestId: string) {
    this.assertRhAccess(user);

    const updatedCount = await this.prisma.reviewRequest.updateMany({
      where: {
        id: requestId,
        status: ReviewRequestStatus.OPEN,
        assignedRhId: null,
      },
      data: {
        status: ReviewRequestStatus.ASSIGNED,
        assignedRhId: user.id,
      },
    });

    if (!updatedCount.count) {
      throw new BadRequestException('This request is no longer available');
    }

    return this.getRhRequestDetail(user, requestId);
  }

  async submitReview(
    user: AuthenticatedUser,
    requestId: string,
    dto: SubmitReviewDto,
  ) {
    this.assertRhAccess(user);

    const request = await this.prisma.reviewRequest.findUnique({
      where: {
        id: requestId,
      },
      select: {
        id: true,
        status: true,
        assignedRhId: true,
        candidate: {
          select: {
            email: true,
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        cv: {
          select: {
            title: true,
          },
        },
        review: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Review request not found');
    }

    if (request.status !== ReviewRequestStatus.ASSIGNED || request.assignedRhId !== user.id) {
      throw new ForbiddenException('This review request is not assigned to you');
    }

    if (request.review) {
      throw new BadRequestException('A review has already been submitted for this request');
    }

    const review = await this.prisma.$transaction(async (tx) => {
      const createdReview = await tx.review.create({
        data: {
          requestId,
          rhId: user.id,
          scoreAts: dto.scoreAts,
          scoreReadability: dto.scoreReadability,
          scoreConsistency: dto.scoreConsistency,
          globalNote: dto.globalNote.trim(),
          sectionProfile: dto.sectionProfile.trim(),
          sectionExperience: dto.sectionExperience.trim(),
          sectionSkills: dto.sectionSkills.trim(),
          suggestions: dto.suggestions.trim(),
          recommendedTemplate: dto.recommendedTemplate.trim(),
        },
        select: {
          id: true,
          scoreAts: true,
          scoreReadability: true,
          scoreConsistency: true,
          globalNote: true,
          sectionProfile: true,
          sectionExperience: true,
          sectionSkills: true,
          suggestions: true,
          recommendedTemplate: true,
          createdAt: true,
        },
      });

      await tx.reviewRequest.update({
        where: {
          id: requestId,
        },
        data: {
          status: ReviewRequestStatus.SUBMITTED,
        },
      });

      return createdReview;
    });

    await this.mailService.sendReviewSubmittedEmail(
      request.candidate.email,
      request.candidate.profile?.fullName ?? null,
      request.cv.title,
    );

    return {
      requestId,
      status: ReviewRequestStatus.SUBMITTED,
      review,
    };
  }

  private assertRhAccess(user: AuthenticatedUser) {
    if (user.role === UserRole.ADMIN) {
      return;
    }

    const isProfileComplete = user.profile?.completionStatus === 'COMPLETE';

    if (
      user.role !== UserRole.RH_PRO ||
      !isProfileComplete ||
      user.profile?.verificationStatus !== VerificationStatus.APPROVED ||
      !user.profile?.verifiedBadge
    ) {
      throw new ForbiddenException('Approved RH access is required');
    }
  }

  private rhQueueSelect() {
    return {
      id: true,
      status: true,
      assignedRhId: true,
      createdAt: true,
      updatedAt: true,
      candidate: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              fullName: true,
              country: true,
              city: true,
              phone: true,
              headline: true,
              yearsExperience: true,
            },
          },
        },
      },
      cv: {
        select: {
          id: true,
          title: true,
          fileType: true,
          category: {
            select: {
              id: true,
              nameFr: true,
              nameEn: true,
              slug: true,
            },
          },
        },
      },
    } as const;
  }
}
