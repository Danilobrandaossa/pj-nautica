import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { AppError } from '../middleware/error-handler';
import { UserRole } from '@prisma/client';
import { JWTPayload } from '../middleware/auth';

export class AuthService {
  async login(email: string, password: string, ip?: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, 'Credenciais inválidas');
    }

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    // Criar tokens
    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Registrar log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        ipAddress: ip,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async refreshToken(token: string) {
    const refreshTokenData = await prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (
      !refreshTokenData ||
      refreshTokenData.isRevoked ||
      refreshTokenData.expiresAt < new Date()
    ) {
      throw new AppError(401, 'Refresh token inválido ou expirado');
    }

    if (!refreshTokenData.user.isActive) {
      throw new AppError(401, 'Usuário inativo');
    }

    // Revogar token antigo
    await prisma.refreshToken.update({
      where: { id: refreshTokenData.id },
      data: { isRevoked: true },
    });

    // Gerar novos tokens
    const accessToken = this.generateAccessToken(
      refreshTokenData.user.id,
      refreshTokenData.user.email,
      refreshTokenData.user.role
    );
    const newRefreshToken = await this.generateRefreshToken(refreshTokenData.user.id);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.updateMany({
        where: {
          userId,
          token: refreshToken,
        },
        data: {
          isRevoked: true,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'LOGOUT',
      },
    });
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        isActive: true,
        createdAt: true,
        vessels: {
          include: {
            vessel: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    return user;
  }

  private generateAccessToken(userId: string, email: string, role: UserRole): string {
    const payload: JWTPayload = { userId, email, role };
    return jwt.sign(payload, config.jwt.secret as string, {
      expiresIn: config.jwt.expiresIn,
    } as any);
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = jwt.sign({ userId }, config.jwt.refreshSecret as string, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as any);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 dias

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }
}



