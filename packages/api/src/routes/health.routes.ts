import { Router, Request, Response } from 'express';
import { healthService } from '../services/health.service.js';

const router = Router();

/**
 * GET /health
 * Basic health check endpoint
 * Returns minimal health information for quick checks
 */
router.get('/health', (_req: Request, res: Response) => {
  const health = healthService.getBasicHealth();

  res.json({
    success: true,
    data: health,
  });
});

/**
 * GET /health/live
 * Liveness probe for Kubernetes/Railway
 * Returns 200 if the server process is running
 * Used to determine if the container should be restarted
 */
router.get('/health/live', (_req: Request, res: Response) => {
  const health = healthService.getLiveness();

  res.json({
    success: true,
    data: health,
  });
});

/**
 * GET /health/ready
 * Readiness probe for Kubernetes/Railway
 * Returns 200 if the server is ready to accept traffic
 * Returns 503 if dependencies (database) are not available
 */
router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    const health = await healthService.getReadiness();

    if (health.status === 'unhealthy') {
      res.status(503).json({
        success: false,
        data: health,
        error: {
          message: 'Service not ready - one or more dependencies are unavailable',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      data: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
      error: {
        message: 'Health check failed',
      },
    });
  }
});

export { router as healthRoutes };
