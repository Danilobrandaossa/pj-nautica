import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: 'Muitas tentativas de login, tente novamente em 15 minutos.',
  skipSuccessfulRequests: true,
});

// Limitador para alterações de senha
export const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: 'Muitas alterações de senha. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitador para criação/atualização de usuários (admin)
export const userMutationLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 30,
  message: 'Muitas operações de usuário. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitador para mutações de agendamentos
export const bookingMutationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 60,
  message: 'Muitas operações de agendamento. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitador para refresh/logout (mitigar abuso)
export const authActionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 60,
  message: 'Muitas requisições de autenticação. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});



