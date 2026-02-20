import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { payloadService } from '../services/payload.service.js';

// Validation schemas
const PayloadCategoryEnum = z.enum([
  'PROMPT_INJECTION',
  'DATA_EXTRACTION',
  'GUARDRAIL_BYPASS',
  'INTEGRATION_VULN',
]);

const SeverityEnum = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']);

const createPayloadSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  category: PayloadCategoryEnum,
  subcategory: z.string().max(100).optional(),
  content: z.string().min(1),
  variables: z.record(z.unknown()).optional(),
  severity: SeverityEnum.optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const updatePayloadSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  category: PayloadCategoryEnum.optional(),
  subcategory: z.string().max(100).nullable().optional(),
  content: z.string().min(1).optional(),
  variables: z.record(z.unknown()).nullable().optional(),
  severity: SeverityEnum.optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const querySchema = z.object({
  category: PayloadCategoryEnum.optional(),
  subcategory: z.string().optional(),
  severity: SeverityEnum.optional(),
  tags: z.string().optional(), // comma-separated
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const bulkImportSchema = z.object({
  payloads: z.array(createPayloadSchema).min(1).max(1000),
});

// Controller functions
export async function listPayloads(req: Request, res: Response, next: NextFunction) {
  try {
    const query = querySchema.parse(req.query);

    const filters = {
      category: query.category,
      subcategory: query.subcategory,
      severity: query.severity,
      tags: query.tags?.split(',').map(t => t.trim()),
      isActive: query.isActive ? query.isActive === 'true' : undefined,
      search: query.search,
    };

    const pagination = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? Math.min(parseInt(query.limit, 10), 100) : 50,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    };

    const result = await payloadService.findAll(filters, pagination);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPayload(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const payload = await payloadService.findById(id);

    res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    next(error);
  }
}

export async function createPayload(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createPayloadSchema.parse(req.body);
    const payload = await payloadService.create(data);

    res.status(201).json({
      success: true,
      data: payload,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePayload(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const data = updatePayloadSchema.parse(req.body);
    const payload = await payloadService.update(id, data);

    res.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePayload(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await payloadService.delete(id);

    res.json({
      success: true,
      message: 'Payload deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await payloadService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await payloadService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

export async function bulkImport(req: Request, res: Response, next: NextFunction) {
  try {
    const { payloads } = bulkImportSchema.parse(req.body);
    const result = await payloadService.bulkCreate(payloads);

    res.status(201).json({
      success: true,
      data: result,
      message: `Successfully imported ${result.created} payloads`,
    });
  } catch (error) {
    next(error);
  }
}

export async function togglePayloadActive(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const payload = await payloadService.toggleActive(id);

    res.json({
      success: true,
      data: payload,
      message: `Payload ${payload.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPayloadsByCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = PayloadCategoryEnum.parse(req.params.category);
    const payloads = await payloadService.findByCategory(category);

    res.json({
      success: true,
      data: payloads,
      count: payloads.length,
    });
  } catch (error) {
    next(error);
  }
}
