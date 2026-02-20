import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { findingsService } from '../services/findings.service.js';

// Validation schemas
const SeverityEnum = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']);
const CategoryEnum = z.enum(['PROMPT_INJECTION', 'DATA_EXTRACTION', 'GUARDRAIL_BYPASS', 'INTEGRATION_VULN']);
const StatusEnum = z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'ACCEPTED_RISK', 'FALSE_POSITIVE']);

const createFindingSchema = z.object({
  projectId: z.string().min(1),
  testResultId: z.string().optional(),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  severity: SeverityEnum,
  category: CategoryEnum,
  evidence: z.record(z.unknown()).optional(),
  remediation: z.string().optional(),
});

const updateFindingSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  severity: SeverityEnum.optional(),
  category: CategoryEnum.optional(),
  evidence: z.record(z.unknown()).optional(),
  remediation: z.string().optional(),
  status: StatusEnum.optional(),
});

const updateStatusSchema = z.object({
  status: StatusEnum,
});

const bulkStatusSchema = z.object({
  ids: z.array(z.string()).min(1),
  status: StatusEnum,
});

const querySchema = z.object({
  projectId: z.string().optional(),
  severity: SeverityEnum.optional(),
  category: CategoryEnum.optional(),
  status: StatusEnum.optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Controller functions
export async function listFindings(req: Request, res: Response, next: NextFunction) {
  try {
    const query = querySchema.parse(req.query);

    const filters = {
      projectId: query.projectId,
      severity: query.severity,
      category: query.category,
      status: query.status,
      search: query.search,
    };

    const pagination = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? Math.min(parseInt(query.limit, 10), 100) : 50,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    };

    const result = await findingsService.findAll(filters, pagination);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFinding(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const finding = await findingsService.findById(id);

    res.json({
      success: true,
      data: finding,
    });
  } catch (error) {
    next(error);
  }
}

export async function createFinding(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createFindingSchema.parse(req.body);
    const finding = await findingsService.create(data);

    res.status(201).json({
      success: true,
      data: finding,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateFinding(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const data = updateFindingSchema.parse(req.body);
    const finding = await findingsService.update(id, data);

    res.json({
      success: true,
      data: finding,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateFindingStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { status } = updateStatusSchema.parse(req.body);
    const finding = await findingsService.updateStatus(id, status);

    res.json({
      success: true,
      data: finding,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteFinding(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await findingsService.delete(id);

    res.json({
      success: true,
      message: 'Finding deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectFindings(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.params.projectId as string;
    const findings = await findingsService.findByProject(projectId);

    res.json({
      success: true,
      data: findings,
      count: findings.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFindingsStats(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.query.projectId as string | undefined;
    const stats = await findingsService.getStats(projectId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

export async function bulkUpdateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids, status } = bulkStatusSchema.parse(req.body);
    const result = await findingsService.bulkUpdateStatus(ids, status);

    res.json({
      success: true,
      data: result,
      message: `Updated ${result.updated} findings`,
    });
  } catch (error) {
    next(error);
  }
}
