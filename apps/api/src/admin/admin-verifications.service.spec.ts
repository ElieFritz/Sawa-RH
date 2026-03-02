import {
  ProfileCompletionStatus,
  UserRole,
  VerificationStatus,
} from '@prisma/client';

import { AdminVerificationsService } from './admin-verifications.service';

describe('AdminVerificationsService', () => {
  it('approves RH_PRO and grants the verified badge', async () => {
    const prismaService = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'rh@example.com',
          role: UserRole.RH_PRO,
          profile: {
            completionStatus: ProfileCompletionStatus.COMPLETE,
            verificationStatus: VerificationStatus.PENDING_REVIEW,
          },
        }),
        update: jest.fn().mockResolvedValue({
          id: 'user-1',
          email: 'rh@example.com',
          role: UserRole.RH_PRO,
          profile: {
            completionStatus: ProfileCompletionStatus.COMPLETE,
            verificationStatus: VerificationStatus.APPROVED,
            verifiedBadge: true,
          },
        }),
      },
    };

    const mailService = {
      sendVerificationDecisionEmail: jest.fn(),
    };

    const service = new AdminVerificationsService(
      prismaService as never,
      mailService as never,
    );

    const result = await service.approveVerification({
      actorUserId: 'admin-1',
      userId: 'user-1',
    });

    expect(prismaService.user.update).toHaveBeenCalled();
    expect(mailService.sendVerificationDecisionEmail).toHaveBeenCalledWith(
      'rh@example.com',
      'APPROVED',
    );
    expect(result.user.profile?.verifiedBadge).toBe(true);
  });
});
