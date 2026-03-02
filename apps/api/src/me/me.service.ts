import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Locale,
  ProfileCompletionStatus,
  UserRole,
  VerificationStatus,
} from '@prisma/client';

import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
      },
    });
  }

  async updateProfile(user: AuthenticatedUser, dto: UpdateProfileDto) {
    const profile = await this.prisma.profile.update({
      where: {
        userId: user.id,
      },
      data: {
        fullName: dto.fullName,
        country: dto.country,
        city: dto.city,
        phone: dto.phone,
        headline: dto.headline,
        yearsExperience: dto.yearsExperience,
        locale: dto.locale === 'en' ? Locale.EN : Locale.FR,
        completionStatus: ProfileCompletionStatus.INCOMPLETE,
      },
    });

    return {
      profile,
    };
  }

  async submitProfile(user: AuthenticatedUser) {
    const currentProfile = await this.prisma.profile.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (
      !currentProfile?.fullName ||
      !currentProfile.country ||
      !currentProfile.city ||
      !currentProfile.phone ||
      !currentProfile.headline
    ) {
      throw new BadRequestException('Profile is incomplete');
    }

    const isReviewRequired =
      user.role === UserRole.RH_PRO || user.role === UserRole.RECRUITER;

    const profile = await this.prisma.profile.update({
      where: {
        userId: user.id,
      },
      data: {
        completionStatus: ProfileCompletionStatus.COMPLETE,
        verificationStatus: isReviewRequired
          ? VerificationStatus.PENDING_REVIEW
          : VerificationStatus.APPROVED,
      },
    });

    return {
      profile,
    };
  }
}
