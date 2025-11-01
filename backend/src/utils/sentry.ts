import { Handler, Request, Response, NextFunction } from 'express';

let sentryEnabled = false;
let sentry: any = null;

try {
  // Dynamically require to avoid hard dependency
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  sentry = require('@sentry/node');
  const dsn = process.env.SENTRY_DSN;
  if (dsn) {
    sentry.init({
      dsn,
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      environment: process.env.NODE_ENV || 'development',
    });
    sentryEnabled = true;
  }
} catch {
  sentryEnabled = false;
}

export const sentryRequestHandler: Handler = sentryEnabled && sentry?.Handlers?.requestHandler
  ? sentry.Handlers.requestHandler()
  : (_req, _res, next) => next();

export const sentryErrorHandler: Handler = sentryEnabled && sentry?.Handlers?.errorHandler
  ? sentry.Handlers.errorHandler()
  : ((err: any, _req: Request, _res: Response, next: NextFunction) => next(err));

export function captureException(err: unknown) {
  if (sentryEnabled && sentry?.captureException) {
    sentry.captureException(err);
  }
}
