import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config';
import { AppError } from './error-handler';

/**
 * CSRF Token Storage - Em produção, usar Redis ou banco de dados
 * Em memória apenas para desenvolvimento
 */
const csrfTokens = new Map<string, { token: string; expiresAt: Date }>();

// Limpar tokens expirados a cada 5 minutos
setInterval(() => {
  const now = new Date();
  for (const [key, value] of csrfTokens.entries()) {
    if (value.expiresAt < now) {
      csrfTokens.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Gerar token CSRF
 */
function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Middleware para gerar e retornar token CSRF
 * Usado em rotas GET que precisam retornar formulários
 */
export const generateCSRF = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Gerar token CSRF
    const token = generateCSRFToken();
    
    // Armazenar token com sessão/identificador do usuário
    const userId = req.user?.userId || req.ip || 'anonymous';
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    
    csrfTokens.set(userId, { token, expiresAt });
    
    // Retornar token no header
    res.setHeader('X-CSRF-Token', token);
    
    // Também retornar no corpo da resposta se for JSON
    if (req.path.includes('/csrf-token')) {
      res.json({ csrfToken: token });
      return;
    }
    
    // Token já foi definido no header, passar para próximo middleware
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para validar token CSRF
 * Deve ser usado em rotas POST, PUT, PATCH, DELETE
 */
export const validateCSRF = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Em desenvolvimento, pode ser desabilitado
    if (config.nodeEnv === 'development' && process.env.DISABLE_CSRF === 'true') {
      return next();
    }

    // Métodos seguros não precisam de validação CSRF
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
      return next();
    }

    // Obter token CSRF do header ou body
    const csrfToken = 
      req.headers['x-csrf-token'] as string ||
      req.headers['xsrf-token'] as string ||
      (req.body?.csrfToken as string) ||
      (req.query?.csrfToken as string);

    if (!csrfToken) {
      throw new AppError(403, 'Token CSRF não fornecido');
    }

    // Obter identificador do usuário
    const userId = req.user?.userId || req.ip || 'anonymous';
    const stored = csrfTokens.get(userId);

    if (!stored) {
      throw new AppError(403, 'Token CSRF não encontrado ou expirado');
    }

    // Verificar expiração
    if (stored.expiresAt < new Date()) {
      csrfTokens.delete(userId);
      throw new AppError(403, 'Token CSRF expirado');
    }

    // Validar token
    if (stored.token !== csrfToken) {
      throw new AppError(403, 'Token CSRF inválido');
    }

    // Token válido, remover para garantir uso único (opcional)
    // Se quiser permitir reutilização, comentar a linha abaixo
    // csrfTokens.delete(userId);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar Origin e Referer (proteção adicional)
 * Complementa a validação CSRF
 */
export const validateOrigin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // Em desenvolvimento, pode ser mais flexível
    if (config.nodeEnv === 'development') {
      return next();
    }

    // Métodos seguros não precisam de validação
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
      return next();
    }

    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // Verificar se há origin ou referer
    if (!origin && !referer) {
      throw new AppError(403, 'Origin ou Referer obrigatórios');
    }

    // Verificar se origin corresponde ao frontend
    if (origin && !config.frontendUrl.includes(origin.replace(/https?:\/\//, '').split(':')[0])) {
      // Em produção, validar exatamente
      if (config.nodeEnv === 'production') {
        const allowedOrigins = [
          config.frontendUrl,
          `https://${config.frontendUrl}`,
          `http://${config.frontendUrl}`,
        ];
        if (!allowedOrigins.includes(origin)) {
          throw new AppError(403, 'Origin não permitido');
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Rota para obter token CSRF
 * GET /api/csrf-token
 */
export const getCSRFToken = (req: Request, res: Response): void => {
  try {
    const userId = req.user?.userId || req.ip || 'anonymous';
    const stored = csrfTokens.get(userId);

    let token: string;
    if (stored && stored.expiresAt > new Date()) {
      token = stored.token;
    } else {
      token = generateCSRFToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
      csrfTokens.set(userId, { token, expiresAt });
    }

    res.json({
      csrfToken: token,
      expiresIn: 3600, // segundos
    });
  } catch (error) {
    res.status(500).json({
      error: 'Erro ao gerar token CSRF',
    });
  }
};

