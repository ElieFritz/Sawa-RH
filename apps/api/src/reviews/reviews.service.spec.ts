import { ForbiddenException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';

import { ReviewsService } from './reviews.service';

describe('ReviewsService', () => {
  it('rejects RH queue access for unapproved RH users', async () => {
    const prismaService = {
      reviewRequest: {
        findMany: jest.fn(),
      },
    };

    const service = new ReviewsService(
      prismaService as never,
      { sendReviewSubmittedEmail: jest.fn() } as never,
    );

    await expect(
      service.getRhQueue({
        id: 'rh-1',
        email: 'rh@example.com',
        role: UserRole.RH_PRO,
        status: UserStatus.ACTIVE,
        profile: {
          fullName: 'Reviewer',
          locale: 'FR',
          completionStatus: 'COMPLETE',
          verificationStatus: 'PENDING_REVIEW',
          verifiedBadge: false,
        },
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prismaService.reviewRequest.findMany).not.toHaveBeenCalled();
  });

  it('allows admins to inspect the RH queue', async () => {
    const prismaService = {
      reviewRequest: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const service = new ReviewsService(
      prismaService as never,
      { sendReviewSubmittedEmail: jest.fn() } as never,
    );

    await expect(
      service.getRhQueue({
        id: 'admin-1',
        email: 'admin@example.com',
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        profile: null,
      }),
    ).resolves.toEqual({
      openRequests: [],
      myAssignedRequests: [],
    });

    expect(prismaService.reviewRequest.findMany).toHaveBeenCalledTimes(2);
  });
});
