import { ForbiddenException, Injectable } from '@nestjs/common';
import {
  CvStatus,
  Prisma,
  UserRole,
  VerificationStatus,
} from '@prisma/client';

import { AuthenticatedUser } from '../common/types/authenticated-user.type';
import { PrismaService } from '../prisma/prisma.service';
import { SearchCvsQueryDto } from './dto/search-cvs-query.dto';

type SearchResultRow = {
  id: string;
  title: string;
  fileType: 'PDF' | 'DOCX';
  createdAt: Date;
  updatedAt: Date;
  searchableText: string | null;
  categoryId: string;
  categoryNameFr: string;
  categoryNameEn: string;
  categorySlug: string;
  ownerUserId: string;
  ownerEmail: string;
  fullName: string | null;
  country: string | null;
  city: string | null;
  phone: string | null;
  headline: string | null;
  yearsExperience: number;
  relevance: number;
};

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchCvs(user: AuthenticatedUser, query: SearchCvsQueryDto) {
    this.assertSearchAccess(user);

    const searchQuery = query.query?.trim() || null;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const offset = (page - 1) * pageSize;

    const conditions: Prisma.Sql[] = [
      Prisma.sql`cv.status = ${CvStatus.ACTIVE}::"CvStatus"`,
      Prisma.sql`cv.deleted_at IS NULL`,
    ];

    if (query.category) {
      conditions.push(Prisma.sql`cv.category_id = ${query.category}::uuid`);
    }

    if (query.country?.trim()) {
      conditions.push(Prisma.sql`LOWER(COALESCE(p.country, '')) LIKE LOWER(${`%${query.country.trim()}%`})`);
    }

    if (query.city?.trim()) {
      conditions.push(Prisma.sql`LOWER(COALESCE(p.city, '')) LIKE LOWER(${`%${query.city.trim()}%`})`);
    }

    if (typeof query.expMin === 'number') {
      conditions.push(Prisma.sql`COALESCE(p.years_experience, 0) >= ${query.expMin}`);
    }

    if (typeof query.expMax === 'number') {
      conditions.push(Prisma.sql`COALESCE(p.years_experience, 0) <= ${query.expMax}`);
    }

    if (searchQuery) {
      conditions.push(
        Prisma.sql`to_tsvector('simple', COALESCE(cv.searchable_text, '')) @@ plainto_tsquery('simple', ${searchQuery})`,
      );
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
    const relevanceSql = searchQuery
      ? Prisma.sql`ts_rank(
          to_tsvector('simple', COALESCE(cv.searchable_text, '')),
          plainto_tsquery('simple', ${searchQuery})
        )`
      : Prisma.sql`0`;

    const orderByClause =
      query.sort === 'relevance' && searchQuery
        ? Prisma.sql`ORDER BY relevance DESC, cv.created_at DESC`
        : Prisma.sql`ORDER BY cv.created_at DESC`;

    const items = await this.prisma.$queryRaw<SearchResultRow[]>(Prisma.sql`
      SELECT
        cv.id AS "id",
        cv.title AS "title",
        cv.file_type AS "fileType",
        cv.created_at AS "createdAt",
        cv.updated_at AS "updatedAt",
        cv.searchable_text AS "searchableText",
        jc.id AS "categoryId",
        jc.name_fr AS "categoryNameFr",
        jc.name_en AS "categoryNameEn",
        jc.slug AS "categorySlug",
        u.id AS "ownerUserId",
        u.email AS "ownerEmail",
        p.full_name AS "fullName",
        p.country AS "country",
        p.city AS "city",
        p.phone AS "phone",
        p.headline AS "headline",
        COALESCE(p.years_experience, 0) AS "yearsExperience",
        ${relevanceSql} AS "relevance"
      FROM cvs cv
      INNER JOIN job_categories jc ON jc.id = cv.category_id
      INNER JOIN users u ON u.id = cv.user_id
      LEFT JOIN profiles p ON p.user_id = u.id
      ${whereClause}
      ${orderByClause}
      LIMIT ${pageSize}
      OFFSET ${offset}
    `);

    const countRows = await this.prisma.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS "total"
      FROM cvs cv
      INNER JOIN job_categories jc ON jc.id = cv.category_id
      INNER JOIN users u ON u.id = cv.user_id
      LEFT JOIN profiles p ON p.user_id = u.id
      ${whereClause}
    `);

    const totalRaw = countRows[0]?.total ?? 0;
    const total = typeof totalRaw === 'bigint' ? Number(totalRaw) : Number(totalRaw);

    return {
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        fileType: item.fileType,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        snippet: item.searchableText?.slice(0, 220) ?? null,
        relevance: Number(item.relevance ?? 0),
        category: {
          id: item.categoryId,
          nameFr: item.categoryNameFr,
          nameEn: item.categoryNameEn,
          slug: item.categorySlug,
        },
        owner: {
          userId: item.ownerUserId,
          fullName: item.fullName,
          email: item.ownerEmail,
          phone: item.phone,
          country: item.country,
          city: item.city,
          headline: item.headline,
          yearsExperience: item.yearsExperience,
        },
      })),
      page,
      pageSize,
      total,
      totalPages: total > 0 ? Math.ceil(total / pageSize) : 0,
    };
  }

  private assertSearchAccess(user: AuthenticatedUser) {
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR;

    if (isAdmin) {
      return;
    }

    const isProfileComplete = user.profile?.completionStatus === 'COMPLETE';

    if (user.role === UserRole.RECRUITER) {
      if (
        isProfileComplete &&
        user.profile?.verificationStatus === VerificationStatus.APPROVED
      ) {
        return;
      }
    }

    if (user.role === UserRole.RH_PRO) {
      if (
        isProfileComplete &&
        user.profile?.verificationStatus === VerificationStatus.APPROVED &&
        user.profile?.verifiedBadge
      ) {
        return;
      }
    }

    throw new ForbiddenException('You do not have access to the CV bank');
  }
}
