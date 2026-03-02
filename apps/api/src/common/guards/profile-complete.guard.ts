import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { AuthenticatedUser } from '../types/authenticated-user.type';

@Injectable()
export class ProfileCompleteGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role === UserRole.ADMIN) {
      return true;
    }

    if (user.profile?.completionStatus !== 'COMPLETE') {
      throw new ForbiddenException('Complete your profile first');
    }

    return true;
  }
}
