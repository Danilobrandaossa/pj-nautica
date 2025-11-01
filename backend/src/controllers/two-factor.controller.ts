import { Request, Response } from 'express';
import { z } from 'zod';
import { TwoFactorService } from '../services/two-factor.service';
import { logger } from '../utils/logger';

const twoFactorService = new TwoFactorService();

// Schema de validação para verificar token
const verifyTokenSchema = z.object({
  token: z.string().min(6, 'Token deve ter pelo menos 6 caracteres').max(8, 'Token deve ter no máximo 8 caracteres')
});

export class TwoFactorController {
  // Gerar secret e QR code para configuração
  async generateSecret(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const result = await twoFactorService.generateSecret(userId);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao gerar secret 2FA:', error);
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // Verificar token 2FA
  async verifyToken(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const validatedData = verifyTokenSchema.parse(req.body);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const isValid = await twoFactorService.verifyToken(userId, validatedData.token);

      return res.json({
        success: true,
        data: { isValid }
      });
    } catch (error) {
      logger.error('Erro ao verificar token 2FA:', error);
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // Habilitar 2FA
  async enableTwoFactor(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const validatedData = verifyTokenSchema.parse(req.body);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const result = await twoFactorService.enableTwoFactor(userId, validatedData.token);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao habilitar 2FA:', error);
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // Desabilitar 2FA
  async disableTwoFactor(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const validatedData = verifyTokenSchema.parse(req.body);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const result = await twoFactorService.disableTwoFactor(userId, validatedData.token);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao desabilitar 2FA:', error);
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // Regenerar códigos de backup
  async regenerateBackupCodes(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;
      const validatedData = verifyTokenSchema.parse(req.body);

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const result = await twoFactorService.regenerateBackupCodes(userId, validatedData.token);

      return res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Erro ao regenerar códigos de backup:', error);
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }

  // Obter status do 2FA
  async getStatus(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado'
        });
      }

      const status = await twoFactorService.getTwoFactorStatus(userId);

      return res.json({
        success: true,
        data: status
      });
    } catch (error) {
      logger.error('Erro ao obter status 2FA:', error);
      return res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      });
    }
  }
}

