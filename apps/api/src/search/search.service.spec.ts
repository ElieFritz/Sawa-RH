import { ForbiddenException } from '@nestjs/common';
import { UserRole, UserStatus } from '@prisma/client';

import { SearchService } from './search.service';

describe('SearchService', () => {
  it('rejects candidates from the CV bank', async () => {
    const prismaService = {
      $queryRaw: jest.fn(),
    };

    const service = new SearchService(prismaService as never);

    await expect(
      service.searchCvs(
        {
          id: 'user-1',
          email: 'candidate@example.com',
          role: UserRole.CANDIDATE,
          status: UserStatus.ACTIVE,
          profile: {
            fullName: 'Candidate',
            locale: 'FR',
            completionStatus: 'COMPLETE',
            verificationStatus: 'APPROVED',
            verifiedBadge: false,
          },
        },
        {
          page: 1,
          pageSize: 10,
          sort: 'recent',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prismaService.$queryRaw).not.toHaveBeenCalled();
  });
});
