import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { AppError } from './error-handler';

/**
 * Middleware para validar parâmetros da URL (req.params)
 */
export const validateParams = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError(
            400,
            `Parâmetros inválidos: ${error.errors.map((e) => e.message).join(', ')}`
          )
        );
      }
      next(error);
    }
  };
};

/**
 * Middleware para validar query strings (req.query)
 */
export const validateQuery = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError(
            400,
            `Query inválida: ${error.errors.map((e) => e.message).join(', ')}`
          )
        );
      }
      next(error);
    }
  };
};

/**
 * Middleware para validar body (req.body) - wrapper para facilitar uso
 */
export const validateBody = <T extends z.ZodTypeAny>(schema: T) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError(
            400,
            `Dados inválidos: ${error.errors.map((e) => e.message).join(', ')}`
          )
        );
      }
      next(error);
    }
  };
};

/**
 * Schemas comuns para validação
 */
export const commonSchemas = {
  uuid: z.string().uuid('ID inválido'),
  uuidParam: z.object({
    id: z.string().uuid('ID inválido'),
  }),
  optionalUuid: z.string().uuid('ID inválido').optional(),
  optionalDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  dateRange: z.object({
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  }),
  pagination: z.object({
    page: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform((val) => parseInt(val, 10)).pipe(z.number().int().positive().max(100)).optional(),
  }),
  booleanQuery: z.object({
    value: z.string().transform((val) => val === 'true'),
  }),
};

/**
 * Valida se uma string é um UUID válido
 * @param id - String para validar
 * @returns true se for UUID válido, false caso contrário
 */
export function isValidUUID(id: string): boolean {
  return z.string().uuid().safeParse(id).success;
}

/**
 * Sanitizar string removendo caracteres perigosos
 */
export function sanitizeString(input: string | undefined): string | undefined {
  if (!input) return input;
  // Remover tags HTML e caracteres perigosos
  return input
    .replace(/<[^>]*>/g, '') // Remove tags HTML
    .replace(/[<>\"'%;()&+]/g, '') // Remove caracteres perigosos
    .trim();
}

/**
 * Validar formato de CPF
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  
  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validar dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

