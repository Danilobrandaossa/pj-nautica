import { PrismaClient } from '@prisma/client';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { AppError } from '../middleware/error-handler';

const prisma = new PrismaClient();

export class TwoFactorService {
  // Gerar secret para 2FA
  async generateSecret(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    if (user.twoFactorEnabled) {
      throw new AppError(400, '2FA já está habilitado para este usuário');
    }

    // Gerar secret
    const secret = speakeasy.generateSecret({
      name: `Embarcações - ${user.name}`,
      issuer: 'Sistema Embarcações',
      length: 32
    });

    // Gerar códigos de backup
    const backupCodes = this.generateBackupCodes();

    // Salvar no banco
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
        backupCodes: JSON.stringify(backupCodes)
      }
    });

    // Gerar QR Code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
      manualEntryKey: secret.base32
    };
  }

  // Verificar código 2FA
  async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFactorSecret) {
      throw new AppError(404, '2FA não configurado para este usuário');
    }

    // Verificar se é um código de backup
    if (user.backupCodes) {
      const backupCodes = JSON.parse(user.backupCodes);
      const backupIndex = backupCodes.indexOf(token);
      
      if (backupIndex !== -1) {
        // Remover código de backup usado
        backupCodes.splice(backupIndex, 1);
        await prisma.user.update({
          where: { id: userId },
          data: {
            backupCodes: JSON.stringify(backupCodes)
          }
        });
        return true;
      }
    }

    // Verificar token TOTP
    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 2 // Permite 2 períodos de tolerância
    });

    return verified;
  }

  // Habilitar 2FA
  async enableTwoFactor(userId: string, token: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFactorSecret) {
      throw new AppError(404, '2FA não configurado para este usuário');
    }

    const isValid = await this.verifyToken(userId, token);
    if (!isValid) {
      throw new AppError(400, 'Token 2FA inválido');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true
      }
    });

    return { success: true, message: '2FA habilitado com sucesso' };
  }

  // Desabilitar 2FA
  async disableTwoFactor(userId: string, token: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFactorEnabled) {
      throw new AppError(404, '2FA não está habilitado para este usuário');
    }

    const isValid = await this.verifyToken(userId, token);
    if (!isValid) {
      throw new AppError(400, 'Token 2FA inválido');
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        backupCodes: null
      }
    });

    return { success: true, message: '2FA desabilitado com sucesso' };
  }

  // Gerar novos códigos de backup
  async regenerateBackupCodes(userId: string, token: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.twoFactorEnabled) {
      throw new AppError(404, '2FA não está habilitado para este usuário');
    }

    const isValid = await this.verifyToken(userId, token);
    if (!isValid) {
      throw new AppError(400, 'Token 2FA inválido');
    }

    const backupCodes = this.generateBackupCodes();

    await prisma.user.update({
      where: { id: userId },
      data: {
        backupCodes: JSON.stringify(backupCodes)
      }
    });

    return { backupCodes };
  }

  // Verificar se usuário tem 2FA habilitado
  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { twoFactorEnabled: true }
    });

    return user?.twoFactorEnabled || false;
  }

  // Gerar códigos de backup
  private generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  }

  // Obter status do 2FA
  async getTwoFactorStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        twoFactorEnabled: true,
        backupCodes: true
      }
    });

    if (!user) {
      throw new AppError(404, 'Usuário não encontrado');
    }

    const backupCodesCount = user.backupCodes ? JSON.parse(user.backupCodes).length : 0;

    return {
      enabled: user.twoFactorEnabled,
      backupCodesCount,
      setupRequired: !user.twoFactorEnabled
    };
  }
}

