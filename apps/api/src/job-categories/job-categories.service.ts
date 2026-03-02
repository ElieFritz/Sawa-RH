import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateJobCategoryDto } from './dto/create-job-category.dto';
import { UpdateJobCategoryDto } from './dto/update-job-category.dto';

@Injectable()
export class JobCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllCategories() {
    return this.prisma.jobCategory.findMany({
      select: {
        id: true,
        nameFr: true,
        nameEn: true,
        slug: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { nameFr: 'asc' }],
    });
  }

  async getActiveCategories() {
    return this.prisma.jobCategory.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        nameFr: true,
        nameEn: true,
        slug: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { nameFr: 'asc' }],
    });
  }

  async createCategory(dto: CreateJobCategoryDto) {
    const slug = await this.ensureUniqueSlug(dto.slug ?? this.toSlug(dto.nameFr));

    return this.prisma.jobCategory.create({
      data: {
        nameFr: dto.nameFr,
        nameEn: dto.nameEn,
        slug,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? (await this.getNextSortOrder()),
      },
      select: {
        id: true,
        nameFr: true,
        nameEn: true,
        slug: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateCategory(categoryId: string, dto: UpdateJobCategoryDto) {
    const category = await this.prisma.jobCategory.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        nameFr: true,
        slug: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const nextNameFr = dto.nameFr ?? category.nameFr;
    const requestedSlug = dto.slug ?? (dto.nameFr ? this.toSlug(nextNameFr) : category.slug);
    const slug = await this.ensureUniqueSlug(requestedSlug, category.id);

    return this.prisma.jobCategory.update({
      where: { id: categoryId },
      data: {
        ...(dto.nameFr !== undefined ? { nameFr: dto.nameFr } : {}),
        ...(dto.nameEn !== undefined ? { nameEn: dto.nameEn } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
        slug,
      },
      select: {
        id: true,
        nameFr: true,
        nameEn: true,
        slug: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async removeCategory(categoryId: string) {
    const category = await this.prisma.jobCategory.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const cvCount = await this.prisma.cV.count({
      where: {
        categoryId,
      },
    });

    if (cvCount > 0) {
      return this.prisma.jobCategory.update({
        where: { id: categoryId },
        data: {
          isActive: false,
        },
        select: {
          id: true,
          nameFr: true,
          nameEn: true,
          slug: true,
          isActive: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    return this.prisma.jobCategory.delete({
      where: { id: categoryId },
      select: {
        id: true,
        nameFr: true,
        nameEn: true,
        slug: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private async getNextSortOrder() {
    const lastCategory = await this.prisma.jobCategory.findFirst({
      orderBy: {
        sortOrder: 'desc',
      },
      select: {
        sortOrder: true,
      },
    });

    return (lastCategory?.sortOrder ?? 0) + 1;
  }

  private async ensureUniqueSlug(baseSlug: string, excludeId?: string) {
    const normalizedBase = this.toSlug(baseSlug);

    if (!normalizedBase) {
      throw new ConflictException('Unable to generate a valid slug');
    }

    const existing = await this.prisma.jobCategory.findFirst({
      where: {
        slug: normalizedBase,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new ConflictException('A category with this slug already exists');
    }

    return normalizedBase;
  }

  private toSlug(value: string) {
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
  }
}
