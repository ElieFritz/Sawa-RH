import { BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('rejects self-registration for admin and moderator roles', async () => {
    const prismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    const service = new AuthService(
      prismaService as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(
      service.register({
        email: 'admin@example.com',
        password: 'Admin1234',
        role: UserRole.ADMIN,
        locale: 'fr',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.register({
        email: 'moderator@example.com',
        password: 'Admin1234',
        role: UserRole.MODERATOR,
        locale: 'fr',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaService.user.findUnique).not.toHaveBeenCalled();
    expect(prismaService.user.create).not.toHaveBeenCalled();
  });
});
