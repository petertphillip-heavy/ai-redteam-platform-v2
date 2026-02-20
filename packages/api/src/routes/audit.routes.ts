import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireRole } from '../middleware/auth.js';
import { auditService, AuditAction, AuditEntity } from '../services/audit.service.js';

const router = Router();

// Query parameter validation schema
const auditQuerySchema = z.object({
  userId: z.string().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'REGISTER', 'PASSWORD_CHANGE', 'VIEW', 'EXPORT']).optional(),
  entity: z.enum(['User', 'Project', 'Payload', 'TestRun', 'Finding', 'Report']).optional(),
  entityId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  sortBy: z.enum(['createdAt', 'action', 'entity']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * GET /api/audit
 * List audit logs with filtering and pagination
 * Admin only
 */
router.get('/', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = auditQuerySchema.parse(req.query);

    const filters = {
      userId: query.userId,
      action: query.action as AuditAction | undefined,
      entity: query.entity as AuditEntity | undefined,
      entityId: query.entityId,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    };

    const pagination = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? Math.min(parseInt(query.limit, 10), 100) : 50,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    };

    const result = await auditService.getAuditLogs(filters, pagination);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/activity
 * Get recent activity summary
 * Admin only
 */
router.get('/activity', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hours = req.query.hours ? parseInt(req.query.hours as string, 10) : 24;
    const result = await auditService.getRecentActivity(Math.min(hours, 168)); // Max 1 week

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/user/:userId
 * Get audit logs for a specific user
 * Admin only
 */
router.get('/user/:userId', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId as string;
    const query = auditQuerySchema.parse(req.query);

    const pagination = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? Math.min(parseInt(query.limit, 10), 100) : 50,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    };

    const result = await auditService.getUserAuditLogs(userId, pagination);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/audit/entity/:entity/:entityId
 * Get audit logs for a specific entity
 * Admin only
 */
router.get('/entity/:entity/:entityId', requireRole('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entity = req.params.entity as string;
    const entityId = req.params.entityId as string;
    const query = auditQuerySchema.parse(req.query);

    // Validate entity type
    const validEntities = ['User', 'Project', 'Payload', 'TestRun', 'Finding', 'Report'];
    if (!validEntities.includes(entity)) {
      res.status(400).json({
        success: false,
        error: `Invalid entity type. Must be one of: ${validEntities.join(', ')}`,
      });
      return;
    }

    const pagination = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? Math.min(parseInt(query.limit, 10), 100) : 50,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    };

    const result = await auditService.getEntityAuditLogs(entity as AuditEntity, entityId, pagination);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

export { router as auditRoutes };
