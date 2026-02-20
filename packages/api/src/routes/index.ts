import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { env } from '../config/env.js';
import { swaggerSpec } from '../config/swagger.js';
import { authenticate } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/audit.js';
import { healthRoutes } from './health.routes.js';
import { authRoutes } from './auth.routes.js';
import { payloadRoutes } from './payloads.routes.js';
import { projectRoutes } from './projects.routes.js';
import { testRoutes } from './tests.routes.js';
import { findingsRoutes } from './findings.routes.js';
import { reportsRoutes } from './reports.routes.js';
import { analyticsRoutes } from './analytics.routes.js';
import { sseRoutes } from './sse.routes.js';
import { exportRoutes } from './export.routes.js';
import { auditRoutes } from './audit.routes.js';
import { usersRoutes } from './users.routes.js';

const router = Router();

// OpenAPI/Swagger documentation (public)
router.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AI Red Team Platform API Docs',
}));

// OpenAPI JSON spec (public)
router.get('/api/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Health check routes (public) - mounted at root level for Kubernetes/Railway
// Provides /health, /health/live, and /health/ready endpoints
router.use(healthRoutes);

// API info endpoint (public)
router.get('/', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'AI Red Team Platform API',
      version: env.API_VERSION,
      description: 'AI Security Red Team / Penetration Testing Platform',
      endpoints: {
        health: '/health',
        healthLive: '/health/live',
        healthReady: '/health/ready',
        docs: '/api/docs',
        docsJson: '/api/docs.json',
        auth: '/api/auth',
        payloads: '/api/payloads',
        projects: '/api/projects',
        tests: '/api/tests',
        findings: '/api/findings',
        reports: '/api/reports',
        analytics: '/api/analytics',
        export: '/api/export',
        audit: '/api/audit',
        users: '/api/users',
      },
    },
  });
});

// Auth routes (public endpoints for login/register)
router.use('/api/auth', authRoutes);

// Protected routes - require authentication
router.use('/api/payloads', authenticate, payloadRoutes);
router.use('/api/projects', authenticate, projectRoutes);
router.use('/api/tests', authenticate, testRoutes);
router.use('/api/findings', authenticate, findingsRoutes);
router.use('/api/reports', authenticate, reportsRoutes);
router.use('/api/analytics', authenticate, analyticsRoutes);

// SSE routes for real-time test progress (has its own auth that supports query param tokens)
router.use('/api/tests', sseRoutes);

// Export routes for CSV downloads
router.use('/api/export', authenticate, exportRoutes);

// Audit routes (admin only, with audit middleware)
router.use('/api/audit', authenticate, auditMiddleware, auditRoutes);

// User management routes (admin only)
router.use('/api/users', authenticate, usersRoutes);

export { router };
