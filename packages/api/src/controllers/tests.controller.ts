import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { testingEngineService } from '../services/testing-engine.service.js';

// Validation schemas
const PayloadCategoryEnum = z.enum([
  'PROMPT_INJECTION',
  'DATA_EXTRACTION',
  'GUARDRAIL_BYPASS',
  'INTEGRATION_VULN',
]);

const startTestSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().max(255).optional(),
  categories: z.array(PayloadCategoryEnum).optional(),
  payloadIds: z.array(z.string()).optional(),
  rateLimit: z.number().min(0.1).max(100).optional(),
  timeout: z.number().min(1000).max(120000).optional(),
  retries: z.number().min(1).max(5).optional(),
  stopOnFirstSuccess: z.boolean().optional(),
  dryRun: z.boolean().optional(),
});

// Controller functions
export async function getAllTests(req: Request, res: Response, next: NextFunction) {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const projectId = req.query.projectId as string | undefined;
    const status = req.query.status as 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | undefined;

    const result = await testingEngineService.getAllTests({ page, limit, projectId, status });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function startTest(req: Request, res: Response, next: NextFunction) {
  try {
    const config = startTestSchema.parse(req.body);
    const progress = await testingEngineService.startTest(config);

    res.status(202).json({
      success: true,
      data: progress,
      message: 'Test run started',
    });
  } catch (error) {
    next(error);
  }
}

export async function getTestRun(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const testRun = await testingEngineService.getTestRun(id);

    res.json({
      success: true,
      data: testRun,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTestProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const progress = testingEngineService.getProgress(id);

    if (!progress) {
      // Try to get from database
      const testRun = await testingEngineService.getTestRun(id);
      res.json({
        success: true,
        data: {
          testRunId: testRun.id,
          status: testRun.status,
          totalPayloads: testRun.totalPayloads,
          completedPayloads: testRun.completedPayloads,
          successfulAttacks: testRun.successfulAttacks,
          errors: [],
        },
      });
    } else {
      res.json({
        success: true,
        data: progress,
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function cancelTest(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await testingEngineService.cancelTest(id);

    res.json({
      success: true,
      message: 'Test cancellation requested',
    });
  } catch (error) {
    next(error);
  }
}

export async function getTestResults(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const results = await testingEngineService.getTestResults(id);

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectTestRuns(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.params.projectId as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const testRuns = await testingEngineService.getProjectTestRuns(projectId, limit);

    res.json({
      success: true,
      data: testRuns,
      count: testRuns.length,
    });
  } catch (error) {
    next(error);
  }
}
