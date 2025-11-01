import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Database
  databaseUrl: process.env.DATABASE_URL || '',
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET é obrigatório em produção');
      }
      return 'dev-secret-key-change-in-production';
    })(),
    refreshSecret: process.env.JWT_REFRESH_SECRET || (() => {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_REFRESH_SECRET é obrigatório em produção');
      }
      return 'dev-refresh-secret-change-in-production';
    })(),
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  
  // n8n Webhooks
  n8n: {
    webhookUrl: process.env.N8N_WEBHOOK_URL || '',
    webhookToken: process.env.N8N_WEBHOOK_TOKEN || '',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 min
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Booking Rules
  booking: {
    minAdvanceHours: 24,
    defaultMaxActiveBookings: 2,
  },
} as const;

export default config;



