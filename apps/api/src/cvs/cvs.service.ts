import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CvStatus, UserRole, VerificationStatus } from '@prisma/client';
import { basename } from 'path';

import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateCvDto } from './dto/create-cv.dto';
import { UpdateCvDto } from './dto/update-cv.dto';
import { CvTextExtractorService } from './cv-text-extractor.service';

@Injectable()
export class CvsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly cvTextExtractorService: CvTextExtractorService,
  ) {}

  async uploadCv(
    user: AuthenticatedUser,
    dto: CreateCvDto,
    file: Express.Multer.File,
  ) {
    const category = await this.prisma.jobCategory.findFirst({
      where: {
        id: dto.categoryId,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!category) {
      throw new BadRequestException('Selected job category is not available');
    }

    const extracted = await this.cvTextExtractorService.extract(file);
    const uploaded = await this.storageService.uploadPrivateCv({
      buffer: file.buffer,
      originalName: file.originalname,
      contentType: file.mimetype,
    });

    try {
      return await this.prisma.cV.create({
        data: {
          userId: user.id,
          categoryId: dto.categoryId,
          title: dto.title.trim(),
          filePath: uploaded.filePath,
          fileType: extracted.fileType,
          status: CvStatus.ACTIVE,
          searchableText: extracted.text,
        },
        select: {
          id: true,
          title: true,
          fileType: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          category: {
            select: {
              id: true,
              nameFr: true,
              nameEn: true,
              slug: true,
            },
          },
        },
      });
    } catch (error) {
      await this.storageService.removePrivateCv(uploaded.filePath);
      throw error;
    }
  }

  async getMyCvs(userId: string) {
    return this.prisma.cV.findMany({
      where: {
        userId,
        status: {
          not: CvStatus.DELETED,
        },
      },
      select: {
        id: true,
        title: true,
        fileType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            nameFr: true,
            nameEn: true,
            slug: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateMyCv(userId: string, cvId: string, dto: UpdateCvDto) {
    const cv = await this.prisma.cV.findFirst({
      where: {
        id: cvId,
        userId,
        status: {
          not: CvStatus.DELETED,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    if (dto.categoryId) {
      const category = await this.prisma.jobCategory.findFirst({
        where: {
          id: dto.categoryId,
          isActive: true,
        },
        select: {
          id: true,
        },
      });

      if (!category) {
        throw new BadRequestException('Selected job category is not available');
      }
    }

    if (
      dto.status &&
      dto.status !== CvStatus.ACTIVE &&
      dto.status !== CvStatus.HIDDEN
    ) {
      throw new BadRequestException('Only ACTIVE or HIDDEN status can be set manually');
    }

    return this.prisma.cV.update({
      where: {
        id: cvId,
      },
      data: {
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.categoryId ? { categoryId: dto.categoryId } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
      select: {
        id: true,
        title: true,
        fileType: true,
        status: true,
        updatedAt: true,
        category: {
          select: {
            id: true,
            nameFr: true,
            nameEn: true,
            slug: true,
          },
        },
      },
    });
  }

  async deleteMyCv(userId: string, cvId: string) {
    const cv = await this.prisma.cV.findFirst({
      where: {
        id: cvId,
        userId,
        status: {
          not: CvStatus.DELETED,
        },
      },
      select: {
        id: true,
        title: true,
        filePath: true,
      },
    });

    if (!cv) {
      throw new NotFoundException('CV not found');
    }

    await this.storageService.removePrivateCv(cv.filePath);

    await this.prisma.cV.update({
      where: {
        id: cvId,
      },
      data: {
        status: CvStatus.DELETED,
        deletedAt: new Date(),
      },
    });

    return {
      id: cv.id,
      title: cv.title,
      deleted: true,
    };
  }

  async getSignedViewUrl(user: AuthenticatedUser, cvId: string) {
    const cv = await this.getAuthorizedCv(user, cvId);
    const url = await this.storageService.createSignedUrl(cv.filePath);

    return {
      url,
      expiresIn: 900,
    };
  }

  async getSignedDownloadUrl(user: AuthenticatedUser, cvId: string) {
    const cv = await this.getAuthorizedCv(user, cvId);
    const fileName = basename(cv.filePath);
    const url = await this.storageService.createSignedUrl(cv.filePath, {
      download: fileName,
    });

    return {
      url,
      expiresIn: 900,
    };
  }

  private async getAuthorizedCv(user: AuthenticatedUser, cvId: string) {
    const cv = await this.prisma.cV.findUnique({
      where: {
        id: cvId,
      },
      select: {
        id: true,
        userId: true,
        filePath: true,
        status: true,
      },
    });

    if (!cv || cv.status === CvStatus.DELETED) {
      throw new NotFoundException('CV not found');
    }

    const isOwner = cv.userId === user.id;
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR;
    const hasBankAccess = this.hasCvBankAccess(user);

    if (!isOwner && !isAdmin && !hasBankAccess) {
      throw new ForbiddenException('You do not have access to this CV');
    }

    if (!isOwner && !isAdmin && cv.status !== CvStatus.ACTIVE) {
      throw new ForbiddenException('Only active CVs can be accessed');
    }

    return cv;
  }

  private hasCvBankAccess(user: AuthenticatedUser) {
    const isProfileComplete = user.profile?.completionStatus === 'COMPLETE';

    if (user.role === UserRole.RECRUITER) {
      return (
        isProfileComplete &&
        user.profile?.verificationStatus === VerificationStatus.APPROVED
      );
    }

    if (user.role === UserRole.RH_PRO) {
      return (
        isProfileComplete &&
        user.profile?.verificationStatus === VerificationStatus.APPROVED &&
        user.profile?.verifiedBadge === true
      );
    }

    return false;
  }
}
