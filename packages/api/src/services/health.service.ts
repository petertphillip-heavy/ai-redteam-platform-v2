import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export type HealthStatus = 'healthy' | 'unhealthy' | 'degraded';
export type CheckStatus = 'up' | 'down';

export interface HealthCheckResult {
  status: CheckStatus;
  latency?: number;
  message?: string;
}

export interface SystemInfo {
  uptime: number;
  uptimeHuman: string;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
  version: string;
  nodeVersion: string;
  environment: string;
}

export interface HealthResponse {
  status: HealthStatus;
  timestamp: string;
  version: string;
  checks?: {
    database?: HealthCheckResult;
  };
  system?: SystemInfo;
}

// Track server start time for uptime calculation
const serverStartTime = Date.now();

class HealthService {
  /**
   * Check database connectivity with a simple query
   * Returns the check result with latency
   */
  async checkDatabase(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    try {
      // Execute a simple query to verify database connectivity
      await prisma.$queryRaw`SELECT 1`;

      const latency = Date.now() - startTime;

      return {
        status: 'up',
        latency,
      };
    } catch (error) {
      const latency = Date.now() - startTime;

      logger.error({ err: error }, 'Database health check failed');

      return {
        status: 'down',
        latency,
        message: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  /**
   * Get system information including uptime, memory usage, and version
   */
  getSystemInfo(): SystemInfo {
    const memoryUsage = process.memoryUsage();
    const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000);

    return {
      uptime: uptimeSeconds,
      uptimeHuman: this.formatUptime(uptimeSeconds),
      memoryUsage: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024), // MB
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      },
      version: env.API_VERSION,
      nodeVersion: process.version,
      environment: env.NODE_ENV,
    };
  }

  /**
   * Check all external dependencies
   * Currently only checks database, but can be extended to check
   * other services like Redis, external APIs, etc.
   */
  async checkDependencies(): Promise<{
    database: HealthCheckResult;
  }> {
    const database = await this.checkDatabase();

    return {
      database,
    };
  }

  /**
   * Basic health check - is the server running?
   * Used for simple health endpoint
   */
  getBasicHealth(): HealthResponse {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: env.API_VERSION,
    };
  }

  /**
   * Liveness probe - is the server process alive?
   * Used by Kubernetes/Railway to determine if the container should be restarted
   */
  getLiveness(): HealthResponse {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: env.API_VERSION,
    };
  }

  /**
   * Readiness probe - is the server ready to accept traffic?
   * Checks all dependencies to determine if requests can be handled
   */
  async getReadiness(): Promise<HealthResponse> {
    const checks = await this.checkDependencies();
    const system = this.getSystemInfo();

    // Determine overall health status
    const allChecksUp = Object.values(checks).every(check => check.status === 'up');
    const status: HealthStatus = allChecksUp ? 'healthy' : 'unhealthy';

    return {
      status,
      timestamp: new Date().toISOString(),
      version: env.API_VERSION,
      checks,
      system,
    };
  }

  /**
   * Format uptime seconds into a human-readable string
   */
  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];

    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }
}

export const healthService = new HealthService();
