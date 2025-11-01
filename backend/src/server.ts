import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';
import { metricsMiddleware, metricsHandler } from './middleware/metrics';
import { sentryRequestHandler, sentryErrorHandler } from './utils/sentry';

// Rotas
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import vesselRoutes from './routes/vessel.routes';
import bookingRoutes from './routes/booking.routes';
import blockedDateRoutes from './routes/blocked-date.routes';
import auditLogRoutes from './routes/audit-log.routes';
import notificationRoutes from './routes/notification.routes';
import financialRoutes from './routes/financial.routes';
import autoNotificationRoutes from './routes/auto-notification.routes';
import adHocChargeRoutes from './routes/ad-hoc-charge.routes';
import weeklyBlockRoutes from './routes/weekly-block.routes';
import twoFactorRoutes from './routes/two-factor.routes';
import csrfRoutes from './routes/csrf.routes';
import docsRoutes from './routes/docs.routes';
import healthRoutes from './routes/health.routes';
import settingsRoutes from './routes/settings.routes';
import webhookRoutes from './routes/webhook.routes';
import webhookAdminRoutes from './routes/webhook-admin.routes';
import unifiedWebhookRoutes from './routes/unified-webhook.routes';
import pwaRoutes from './routes/pwa.routes';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();

// Sentry (opcional)
app.use(sentryRequestHandler);

// Middlewares de segurança
app.use(helmet());

// CORS - aceitar múltiplas origens para desenvolvimento
const staticAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3005',
  'http://192.168.15.21:3000',
  'http://192.168.15.21:3005',
  'http://192.168.1.105:3000',
  'http://192.168.1.105:3005',
  config.frontendUrl
];

import { settingsService } from './services/settings.service';

// Health check simples antes de CORS (para Docker healthchecks)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Middleware para permitir requisições HEAD/OPTIONS/GET sem Origin em produção (healthchecks)
app.use((req, res, next) => {
  // Em produção, se não houver Origin e for HEAD/OPTIONS/GET, permitir diretamente
  if (config.nodeEnv === 'production' && !req.headers.origin && ['HEAD', 'OPTIONS', 'GET'].includes(req.method)) {
    // Para requisições sem origin, enviar headers CORS básicos e continuar
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Se for OPTIONS, responder imediatamente
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    // IMPORTANTE: chamar callback(null, true) para skip CORS validation
  }
  return next();
});

// Health check ANTES do CORS para bypass completo (igual ao /health)
app.use('/api/health', healthRoutes);

// Registrar rotas PWA ANTES do CORS para bypass completo
app.use('/api/pwa', pwaRoutes);

// CORS para outras rotas (com validação de origin)
app.use(cors({
  origin: async (origin, callback) => {
    // Em desenvolvimento, permitir requisições sem origin (Postman, etc)
    if (config.nodeEnv === 'development' && !origin) {
      return callback(null, true);
    }
    
    // Em produção, permitir requisições sem origin apenas para healthchecks/crawlers
    // Isso permite que healthchecks do Docker/Kubernetes funcionem corretamente
    if (config.nodeEnv === 'production' && !origin) {
      return callback(new Error('Origin é obrigatório em produção'));
    }
    
    const dynamicOrigins = await settingsService.get<string[]>('frontend.allowedOrigins', []);
    const allowedOrigins = new Set([...
      staticAllowedOrigins,
      ...(Array.isArray(dynamicOrigins) ? dynamicOrigins : [])
    ]);

    if (origin && allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
}));

// Rate limiting
app.use(rateLimiter);

// Parser de JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics
app.use(metricsMiddleware);

// Logger de requisições
app.use((_req, _res, next) => {
  logger.info(`${_req.method} ${_req.path}`, {
    ip: _req.ip,
    userAgent: _req.get('user-agent'),
  });
  next();
});

// PWA routes já foram registradas antes do CORS (linha 64)
// Health check já foi registrado ANTES do CORS (linha 83)
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/webhooks', webhookAdminRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/unified-webhook', unifiedWebhookRoutes);

// Rotas da API (compatibilidade com versão anterior)
app.use('/api', csrfRoutes); // Rota para obter token CSRF (deve vir antes)
app.use('/api', docsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vessels', vesselRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/blocked-dates', blockedDateRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/auto-notifications', autoNotificationRoutes);
app.use('/api/ad-hoc-charges', adHocChargeRoutes);
app.use('/api/weekly-blocks', weeklyBlockRoutes);
app.use('/api/two-factor', twoFactorRoutes);

// API Versionada (v1)
import v1Routes from './routes/v1/index';
app.use('/api/v1', v1Routes);

// Health check básico (compatibilidade com versão anterior)
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv
  });
});

// Metrics endpoint
app.get('/api/metrics', metricsHandler);

// Rota 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
  });
});

// Error handler
app.use(sentryErrorHandler);
app.use(errorHandler);

// Iniciar servidor
const PORT = config.port;
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Servidor rodando na porta ${PORT}`);
  logger.info(`🌍 Ambiente: ${config.nodeEnv}`);
  logger.info(`🔗 Frontend: ${config.frontendUrl}`);
  logger.info(`📱 Acesso móvel: http://192.168.15.21:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT recebido, encerrando servidor...');
  process.exit(0);
});

