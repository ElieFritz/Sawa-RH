import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Locale, Prisma, UserRole, UserStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

type JwtTokenType = 'access' | 'refresh' | 'reset';

type TokenPayload = {
  sub: string;
  role: UserRole;
  email: string;
  tokenType: JwtTokenType;
};

const selfServeRoles: UserRole[] = [UserRole.CANDIDATE, UserRole.RH_PRO, UserRole.RECRUITER];

const authUserInclude = {
  profile: true,
} satisfies Prisma.UserInclude;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase().trim();
    const role = dto.role;

    if (!selfServeRoles.includes(role)) {
      throw new BadRequestException('This role cannot be self-registered');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        profile: {
          create: {
            locale: dto.locale === 'en' ? Locale.EN : Locale.FR,
          },
        },
      },
      include: authUserInclude,
    });

    const tokens = await this.signTokens(user.id, user.email, user.role);

    return this.buildAuthPayload(user, tokens);
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: authUserInclude,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('This account is not active');
    }

    const isValidPassword = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.signTokens(user.id, user.email, user.role);

    return this.buildAuthPayload(user, tokens);
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyToken(refreshToken, 'refresh');
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: authUserInclude,
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.signTokens(user.id, user.email, user.role);

    return this.buildAuthPayload(user, tokens);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const token = await this.jwtService.signAsync(
        {
          sub: user.id,
          role: user.role,
          email: user.email,
          tokenType: 'reset',
        } satisfies TokenPayload,
        {
          secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
          expiresIn: this.configService.get<string>('JWT_RESET_TTL', '30m'),
        },
      );

      const baseUrl = this.configService.get<string>('APP_BASE_URL', 'http://localhost:3000');
      const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;

      await this.mailService.sendPasswordResetEmail(user.email, resetLink);
    }

    return {
      message: 'If an account exists, a password reset email has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const payload = await this.verifyToken(dto.token, 'reset');
    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.user.update({
      where: { id: payload.sub },
      data: {
        passwordHash,
      },
    });

    return {
      message: 'Password updated successfully.',
    };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: authUserInclude,
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Authentication failed');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: user.profile
        ? {
            fullName: user.profile.fullName,
            locale: user.profile.locale,
            completionStatus: user.profile.completionStatus,
            verificationStatus: user.profile.verificationStatus,
            verifiedBadge: user.profile.verifiedBadge,
          }
        : null,
    };
  }

  private async signTokens(userId: string, email: string, role: UserRole) {
    const accessSecret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');

    const accessPayload = {
      sub: userId,
      role,
      email,
      tokenType: 'access',
    } satisfies TokenPayload;

    const refreshPayload = {
      sub: userId,
      role,
      email,
      tokenType: 'refresh',
    } satisfies TokenPayload;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: accessSecret,
        expiresIn: this.configService.get<string>('JWT_ACCESS_TTL', '15m'),
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: refreshSecret,
        expiresIn: this.configService.get<string>('JWT_REFRESH_TTL', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async verifyToken(token: string, expectedTokenType: JwtTokenType) {
    try {
      const secret =
        expectedTokenType === 'refresh'
          ? this.configService.getOrThrow<string>('JWT_REFRESH_SECRET')
          : this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');

      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret,
      });

      if (payload.tokenType !== expectedTokenType) {
        throw new UnauthorizedException('Invalid token');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private buildAuthPayload(
    user: Prisma.UserGetPayload<{ include: typeof authUserInclude }>,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        profile: user.profile
          ? {
              fullName: user.profile.fullName,
              locale: user.profile.locale,
              completionStatus: user.profile.completionStatus,
              verificationStatus: user.profile.verificationStatus,
              verifiedBadge: user.profile.verifiedBadge,
            }
          : null,
      },
      tokens,
    };
  }
}
