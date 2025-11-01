import express from 'express';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { logger } from '../utils/logger';
import axios from 'axios';

const router = express.Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: CheckResult;
    n8n?: CheckResult;
    timestamp: string;
    uptime: number;
    environment: string;
  };
}

interface CheckResult {
  status: 'ok' | 'error';
  message?: string;
  responseTime?: number;
}

/**
 * GET /api/health
 * Health check endpoint básico (para load balancers)
 */
router.get('/', async (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  });
});

/**
 * GET /api/health/detailed
 * Health check detalhado com verificações de dependências
 */
router.get('/detailed', async (_req, res) => {
  const startTime = Date.now();
  const healthStatus: HealthStatus = {
    status: 'healthy',
    checks: {
      database: { status: 'error' },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
    },
  };

  // Verificar banco de dados
  const dbStartTime = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStartTime;
    healthStatus.checks.database = {
      status: 'ok',
      responseTime: dbResponseTime,
    };
  } catch (error) {
    logger.error('Database health check failed:', error);
    healthStatus.checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Database connection failed',
    };
    healthStatus.status = 'unhealthy';
  }

  // Verificar n8n (se configurado)
  if (config.n8n.webhookUrl) {
    const n8nStartTime = Date.now();
    try {
      // Tentar fazer uma requisição HEAD para verificar se o webhook está acessível
      await axios.head(config.n8n.webhookUrl, {
        timeout: 5000,
        validateStatus: (status) => status < 500, // Aceitar qualquer status < 500
      });
      const n8nResponseTime = Date.now() - n8nStartTime;
      healthStatus.checks.n8n = {
        status: 'ok',
        responseTime: n8nResponseTime,
      };
    } catch (error) {
      logger.warn('n8n health check failed:', error instanceof Error ? error.message : 'Unknown error');
      healthStatus.checks.n8n = {
        status: 'error',
        message: error instanceof Error ? error.message : 'n8n webhook unavailable',
      };
      // n8n não é crítico, então não marca como unhealthy
      if (healthStatus.status === 'healthy') {
        healthStatus.status = 'degraded';
      }
    }
  }

  const totalResponseTime = Date.now() - startTime;
  const statusCode = healthStatus.status === 'healthy' ? 200 : healthStatus.status === 'degraded' ? 200 : 503;

  res.status(statusCode).json({
    ...healthStatus,
    responseTime: totalResponseTime,
  });
});

/**
 * GET /api/health/readiness
 * Readiness probe (kubernetes/docker)
 */
router.get('/readiness', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Database unavailable',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/health/liveness
 * Liveness probe (kubernetes/docker)
 */
router.get('/liveness', (_req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;

