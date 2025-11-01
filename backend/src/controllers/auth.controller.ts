import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório'),
});

const logoutSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token é obrigatório').optional(),
});

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const ip = req.ip || req.socket.remoteAddress;

      const result = await authService.login(email, password, ip);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);

      const result = await authService.refreshToken(refreshToken);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { refreshToken } = logoutSchema.parse(req.body);

      await authService.logout(userId, refreshToken);

      res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;

      const user = await authService.me(userId);

      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}



