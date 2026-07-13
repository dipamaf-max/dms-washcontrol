import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private async signTokens(userId: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId },
        {
          secret: this.config.get<string>('JWT_ACCESS_SECRET'),
          expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN'),
        },
      ),
      this.jwt.signAsync(
        { sub: userId },
        {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN'),
        },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  // Public self-registration always creates a STATION OWNER account.
  // ADMIN accounts are seeded, EMPLOYEE accounts are created by owners via the employees module.
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Un compte existe déjà avec cet email');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        fullName: dto.fullName,
        role: Role.OWNER,
      },
    });

    const tokens = await this.signTokens(user.id);
    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const tokens = await this.signTokens(user.id);
    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Compte introuvable ou désactivé');
    }

    return this.signTokens(user.id);
  }
}
