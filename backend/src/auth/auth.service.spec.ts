import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: Record<string, jest.Mock> };
  let jwt: { signAsync: jest.Mock; verifyAsync: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwt = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
      verifyAsync: jest.fn(),
    };
    config = {
      get: jest.fn((key: string) => `config-${key}`),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
    );
  });

  describe('register', () => {
    it('creates a new OWNER account and returns tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'owner@example.com',
        fullName: 'Owner Test',
        role: Role.OWNER,
      });

      const result = await service.register({
        email: 'owner@example.com',
        password: 'password123',
        fullName: 'Owner Test',
      });

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: Role.OWNER }),
        }),
      );
      expect(result.user.role).toBe(Role.OWNER);
      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
    });

    it('rejects registration when the email already exists', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

      await expect(
        service.register({
          email: 'owner@example.com',
          password: 'password123',
          fullName: 'Owner Test',
        }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns tokens when credentials are valid', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'owner@example.com',
        fullName: 'Owner Test',
        role: Role.OWNER,
        isActive: true,
        passwordHash,
      });

      const result = await service.login({
        email: 'owner@example.com',
        password: 'correct-password',
      });

      expect(result.accessToken).toBe('signed-token');
      expect(result.user.email).toBe('owner@example.com');
    });

    it('rejects an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'unknown@example.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an incorrect password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 10);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'owner@example.com',
        isActive: true,
        passwordHash,
      });

      await expect(
        service.login({ email: 'owner@example.com', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a deactivated account', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'owner@example.com',
        isActive: false,
        passwordHash: 'irrelevant',
      });

      await expect(
        service.login({ email: 'owner@example.com', password: 'whatever' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('issues new tokens for a valid refresh token', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'user-1' });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: true });

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('signed-token');
      expect(result.refreshToken).toBe('signed-token');
    });

    it('rejects an invalid or expired refresh token', async () => {
      jwt.verifyAsync.mockRejectedValue(new Error('invalid token'));

      await expect(service.refresh('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a refresh token for a deactivated user', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'user-1' });
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', isActive: false });

      await expect(service.refresh('valid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
