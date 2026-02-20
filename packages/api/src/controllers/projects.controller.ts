import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { projectService } from '../services/project.service.js';
import { auditService, extractIpAddress, extractUserAgent } from '../services/audit.service.js';

// Validation schemas
const TargetTypeEnum = z.enum(['API', 'CHATBOT', 'COPILOT', 'AGENT', 'CUSTOM']);

const projectConfigSchema = z.object({
  headers: z.record(z.string()).optional(),
  method: z.enum(['POST', 'GET']).optional(),
  bodyTemplate: z.string().optional(),
  responseField: z.string().optional(),
  timeout: z.number().min(1000).max(120000).optional(),
  rateLimit: z.number().min(0.1).max(100).optional(),
}).optional();

const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  targetUrl: z.string().url().optional(),
  targetType: TargetTypeEnum.optional(),
  apiKey: z.string().max(500).optional(),
  config: projectConfigSchema,
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).nullable().optional(),
  targetUrl: z.string().url().nullable().optional(),
  targetType: TargetTypeEnum.optional(),
  apiKey: z.string().max(500).nullable().optional(),
  config: projectConfigSchema.nullable(),
});

const querySchema = z.object({
  search: z.string().optional(),
  targetType: TargetTypeEnum.optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Controller functions
export async function listProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const query = querySchema.parse(req.query);

    const filters = {
      search: query.search,
      targetType: query.targetType,
    };

    const pagination = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? Math.min(parseInt(query.limit, 10), 100) : 20,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    };

    const result = await projectService.findAll(filters, pagination);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProject(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const project = await projectService.findById(id);

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createProjectSchema.parse(req.body);
    const project = await projectService.create(data);

    // Log project creation
    await auditService.logAction({
      userId: req.user?.userId,
      action: 'CREATE',
      entity: 'Project',
      entityId: project.id,
      metadata: { name: project.name, targetType: project.targetType },
      ipAddress: extractIpAddress(req),
      userAgent: extractUserAgent(req),
    });

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const data = updateProjectSchema.parse(req.body);
    const project = await projectService.update(id, data);

    // Log project update
    await auditService.logAction({
      userId: req.user?.userId,
      action: 'UPDATE',
      entity: 'Project',
      entityId: project.id,
      metadata: { changes: Object.keys(data) },
      ipAddress: extractIpAddress(req),
      userAgent: extractUserAgent(req),
    });

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;

    // Get project name before deletion for audit log
    const project = await projectService.findById(id);
    const projectName = project.name;

    await projectService.delete(id);

    // Log project deletion
    await auditService.logAction({
      userId: req.user?.userId,
      action: 'DELETE',
      entity: 'Project',
      entityId: id,
      metadata: { name: projectName },
      ipAddress: extractIpAddress(req),
      userAgent: extractUserAgent(req),
    });

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectStats(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const stats = await projectService.getProjectStats(id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
