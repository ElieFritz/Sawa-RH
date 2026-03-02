import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { AuthenticatedUser } from '../types/authenticated-user.type';

@Injectable()
export class VerificationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const requiresApproval = user.role === 'RH_PRO' || user.role === 'RECRUITER';

    if (!requiresApproval) {
      return true;
    }

    if (user.profile?.verificationStatus !== 'APPROVED') {
      throw new ForbiddenException('Profile approval required');
    }

    return true;
  }
}
