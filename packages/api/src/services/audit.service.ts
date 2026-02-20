import { Request } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';

// Audit action types
export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_CHANGE'
  | 'VIEW'
  | 'EXPORT';

// Entity types that can be audited
export type AuditEntity =
  | 'User'
  | 'Project'
  | 'Payload'
  | 'TestRun'
  | 'Finding'
  | 'Report';

export interface LogActionParams {
  userId?: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditLogFilters {
  userId?: string;
  action?: AuditAction;
  entity?: AuditEntity;
  entityId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Extract IP address from request
 * Handles various proxy headers
 */
export function extractIpAddress(req: Request): string | null {
  // Check for forwarded headers (when behind a proxy/load balancer)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(',')[0];
    return ips.trim();
  }

  // Check for real IP header (nginx)
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fall back to connection remote address
  return req.ip || req.socket?.remoteAddress || null;
}

/**
 * Extract user agent from request
 */
export function extractUserAgent(req: Request): string | null {
  const userAgent = req.headers['user-agent'];
  if (!userAgent) return null;

  // Truncate very long user agents
  return userAgent.substring(0, 500);
}

class AuditService {
  /**
   * Create an audit log entry
   */
  async logAction(params: LogActionParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          metadata: params.metadata as Prisma.InputJsonValue ?? Prisma.DbNull,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      // Log error but don't throw - audit logging should not break main operations
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Create audit log entry from request context
   */
  async logFromRequest(
    req: Request,
    action: AuditAction,
    entity: AuditEntity,
    entityId?: string | null,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    await this.logAction({
      userId: req.user?.userId,
      action,
      entity,
      entityId,
      metadata,
      ipAddress: extractIpAddress(req),
      userAgent: extractUserAgent(req),
    });
  }

  /**
   * Get audit logs with filtering and pagination
   */
  async getAuditLogs(filters: AuditLogFilters = {}, pagination: PaginationOptions = {}) {
    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.entity) {
      where.entity = filters.entity;
    }

    if (filters.entityId) {
      where.entityId = filters.entityId;
    }

    // Date range filtering
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit logs for a specific entity
   */
  async getEntityAuditLogs(entity: AuditEntity, entityId: string, pagination: PaginationOptions = {}) {
    return this.getAuditLogs({ entity, entityId }, pagination);
  }

  /**
   * Get audit logs for a specific user
   */
  async getUserAuditLogs(userId: string, pagination: PaginationOptions = {}) {
    return this.getAuditLogs({ userId }, pagination);
  }

  /**
   * Get recent activity summary
   */
  async getRecentActivity(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const [actionCounts, entityCounts, recentLogs] = await Promise.all([
      prisma.auditLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: since } },
        _count: { action: true },
      }),
      prisma.auditLog.groupBy({
        by: ['entity'],
        where: { createdAt: { gte: since } },
        _count: { entity: true },
      }),
      prisma.auditLog.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      timeRange: {
        hours,
        since,
      },
      actionCounts: Object.fromEntries(
        actionCounts.map(a => [a.action, a._count.action])
      ),
      entityCounts: Object.fromEntries(
        entityCounts.map(e => [e.entity, e._count.entity])
      ),
      recentLogs,
    };
  }
}

export const auditService = new AuditService();
