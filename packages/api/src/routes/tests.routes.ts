import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  getAllTests,
  startTest,
  getTestRun,
  getTestProgress,
  cancelTest,
  getTestResults,
} from '../controllers/tests.controller.js';

const router = Router();

// GET /api/tests - List all test runs
router.get('/', asyncHandler(getAllTests));

// POST /api/tests - Start a new test run
router.post('/', asyncHandler(startTest));

// GET /api/tests/:id - Get test run details
router.get('/:id', asyncHandler(getTestRun));

// GET /api/tests/:id/progress - Get live test progress
router.get('/:id/progress', asyncHandler(getTestProgress));

// GET /api/tests/:id/results - Get test results
router.get('/:id/results', asyncHandler(getTestResults));

// POST /api/tests/:id/cancel - Cancel a running test
router.post('/:id/cancel', asyncHandler(cancelTest));

export { router as testRoutes };
