import { Request, Response, NextFunction } from 'express';

type CounterMap = Record<string, number>;

const counters: CounterMap = {
  requests_total: 0,
  errors_total: 0,
};

const routeCounters: CounterMap = {};

const latencies: Record<string, { count: number; totalMs: number; maxMs: number }> = {};

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  counters.requests_total += 1;

  const routeKey = `${req.method} ${req.path}`;
  routeCounters[routeKey] = (routeCounters[routeKey] || 0) + 1;

  res.on('finish', () => {
    const ms = Date.now() - start;
    const bucket = (latencies[routeKey] = latencies[routeKey] || { count: 0, totalMs: 0, maxMs: 0 });
    bucket.count += 1;
    bucket.totalMs += ms;
    if (ms > bucket.maxMs) bucket.maxMs = ms;

    if (res.statusCode >= 500) {
      counters.errors_total += 1;
    }
  });

  next();
}

export function metricsHandler(_req: Request, res: Response) {
  const avgLatencies: Record<string, { avgMs: number; maxMs: number; count: number }> = {};
  for (const [k, v] of Object.entries(latencies)) {
    avgLatencies[k] = {
      avgMs: v.count ? Math.round((v.totalMs / v.count) * 100) / 100 : 0,
      maxMs: v.maxMs,
      count: v.count,
    };
  }

  res.json({
    counters,
    routes: routeCounters,
    latencies: avgLatencies,
    timestamp: new Date().toISOString(),
  });
}





