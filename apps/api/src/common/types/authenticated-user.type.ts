import type { UserRole, UserStatus } from '@prisma/client';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profile: {
    fullName: string | null;
    locale: 'FR' | 'EN';
    completionStatus: 'INCOMPLETE' | 'COMPLETE';
    verificationStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
    verifiedBadge: boolean;
  } | null;
};
