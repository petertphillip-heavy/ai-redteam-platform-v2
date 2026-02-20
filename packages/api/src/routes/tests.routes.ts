import { Router } from 'express';
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
router.get('/', getAllTests);

// POST /api/tests - Start a new test run
router.post('/', startTest);

// GET /api/tests/:id - Get test run details
router.get('/:id', getTestRun);

// GET /api/tests/:id/progress - Get live test progress
router.get('/:id/progress', getTestProgress);

// GET /api/tests/:id/results - Get test results
router.get('/:id/results', getTestResults);

// POST /api/tests/:id/cancel - Cancel a running test
router.post('/:id/cancel', cancelTest);

export { router as testRoutes };
