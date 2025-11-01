import { AuthService } from '../../services/auth.service';
import { prisma } from '../../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

// Mock do Prisma
jest.mock('../../utils/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

// Mock do bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

// Mock do jwt
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

// Mock do config
jest.mock('../../config', () => ({
  config: {
    jwt: {
      secret: 'test-secret',
      refreshSecret: 'test-refresh-secret',
      expiresIn: '15m',
      refreshExpiresIn: '7d',
    },
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      password: 'hashed-password',
      name: 'Test User',
      role: UserRole.USER,
      isActive: true,
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'correct-password';
      const ip = '127.0.0.1';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedJwt.sign.mockReturnValueOnce('access-token' as never);
      mockedJwt.sign.mockReturnValueOnce('refresh-token' as never);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        token: 'refresh-token',
        userId: 'user-123',
        expiresAt,
      });
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      // Act
      const result = await authService.login(email, password, ip);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(email);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
    });

    it('should throw error with invalid email', async () => {
      // Arrange
      const email = 'wrong@example.com';
      const password = 'password';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow('Credenciais inválidas');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(mockedBcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw error with invalid password', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrong-password';

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow('Credenciais inválidas');
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(password, mockUser.password);
    });

    it('should throw error for inactive user', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password';
      const inactiveUser = { ...mockUser, isActive: false };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(inactiveUser);

      // Act & Assert
      await expect(authService.login(email, password)).rejects.toThrow('Credenciais inválidas');
    });
  });

  describe('refreshToken', () => {
    const mockRefreshToken = {
      id: 'token-123',
      token: 'valid-refresh-token',
      userId: 'user-123',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias no futuro
      isRevoked: false,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: UserRole.USER,
        isActive: true,
      },
    };

    it('should successfully refresh token', async () => {
      // Arrange
      const refreshToken = 'valid-refresh-token';

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockRefreshToken);
      mockedJwt.sign.mockReturnValueOnce('new-access-token' as never);
      mockedJwt.sign.mockReturnValueOnce('new-refresh-token' as never);
      
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      (prisma.refreshToken.update as jest.Mock).mockResolvedValue({});
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({
        token: 'new-refresh-token',
        userId: 'user-123',
        expiresAt,
      });

      // Act
      const result = await authService.refreshToken(refreshToken);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: refreshToken },
        include: { user: true },
      });
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockRefreshToken.id },
        data: { isRevoked: true },
      });
    });

    it('should throw error for invalid refresh token', async () => {
      // Arrange
      const refreshToken = 'invalid-token';

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Refresh token inválido ou expirado');
    });

    it('should throw error for revoked refresh token', async () => {
      // Arrange
      const refreshToken = 'revoked-token';
      const revokedToken = { ...mockRefreshToken, isRevoked: true };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(revokedToken);

      // Act & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Refresh token inválido ou expirado');
    });

    it('should throw error for expired refresh token', async () => {
      // Arrange
      const refreshToken = 'expired-token';
      const expiredToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000), // 1 segundo atrás
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(expiredToken);

      // Act & Assert
      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Refresh token inválido ou expirado');
    });
  });
});






