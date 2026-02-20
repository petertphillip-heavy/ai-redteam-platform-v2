import { Request, Response, NextFunction } from 'express';
import {
  auditService,
  AuditAction,
  AuditEntity,
  extractIpAddress,
  extractUserAgent,
} from '../services/audit.service.js';

/**
 * Audit helper interface attached to request
 */
export interface AuditHelper {
  /**
   * Log an audit action
   * @param action - The action being performed (CREATE, UPDATE, DELETE, etc.)
   * @param entity - The entity type being acted upon
   * @param entityId - Optional ID of the entity
   * @param metadata - Optional additional context
   */
  log: (
    action: AuditAction,
    entity: AuditEntity,
    entityId?: string | null,
    metadata?: Record<string, unknown>
  ) => Promise<void>;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      audit: AuditHelper;
    }
  }
}

/**
 * Middleware that injects audit helper into request object
 * This allows controllers to easily log audit events
 */
export function auditMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const ipAddress = extractIpAddress(req);
  const userAgent = extractUserAgent(req);

  req.audit = {
    log: async (
      action: AuditAction,
      entity: AuditEntity,
      entityId?: string | null,
      metadata?: Record<string, unknown>
    ): Promise<void> => {
      await auditService.logAction({
        userId: req.user?.userId,
        action,
        entity,
        entityId,
        metadata,
        ipAddress,
        userAgent,
      });
    },
  };

  next();
}

/**
 * Higher-order function to create automatic audit logging for route handlers
 * This wraps a controller function to automatically log the action
 */
export function withAuditLog(
  action: AuditAction,
  entity: AuditEntity,
  getEntityId?: (req: Request, result?: unknown) => string | null | undefined
) {
  return function (
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
  ) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        // Store original json method to intercept response
        const originalJson = res.json.bind(res);
        let responseData: unknown;

        res.json = function (data: unknown) {
          responseData = data;
          return originalJson(data);
        };

        await handler(req, res, next);

        // Log the action after successful completion
        const rawEntityId = getEntityId ? getEntityId(req, responseData) : req.params.id;
        const entityId = Array.isArray(rawEntityId) ? rawEntityId[0] : rawEntityId;
        await req.audit.log(action, entity, entityId);
      } catch (error) {
        next(error);
      }
    };
  };
}
