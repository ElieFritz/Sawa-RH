import { BadRequestException } from '@nestjs/common';

import { ModerationService } from './moderation.service';

describe('ModerationService', () => {
  const prisma = {
    cV: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    report: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  } as any;

  let service: ModerationService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ModerationService(prisma);
  });

  it('creates a user report when the target exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'target-user-id' });
    prisma.report.findFirst.mockResolvedValue(null);
    prisma.report.create.mockResolvedValue({
      id: 'report-id',
      targetType: 'USER',
      targetId: 'target-user-id',
      reason: 'Signalement suffisamment detaille.',
      status: 'OPEN',
      createdAt: new Date(),
    });

    const result = await service.createReport('reporter-id', {
      targetType: 'USER',
      targetId: 'target-user-id',
      reason: '  Signalement suffisamment detaille.  ',
    });

    expect(prisma.report.create).toHaveBeenCalledWith({
      data: {
        reporterUserId: 'reporter-id',
        targetType: 'USER',
        targetId: 'target-user-id',
        reason: 'Signalement suffisamment detaille.',
      },
      select: {
        id: true,
        targetType: true,
        targetId: true,
        reason: true,
        status: true,
        createdAt: true,
      },
    });
    expect(result.id).toBe('report-id');
  });

  it('rejects duplicate open reports for the same target', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'target-user-id' });
    prisma.report.findFirst.mockResolvedValue({ id: 'existing-report-id' });

    await expect(
      service.createReport('reporter-id', {
        targetType: 'USER',
        targetId: 'target-user-id',
        reason: 'Signalement suffisamment detaille.',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
