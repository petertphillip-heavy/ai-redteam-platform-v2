import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import {
  generateReport,
  getReport,
  deleteReport,
  downloadReport,
} from '../controllers/reports.controller.js';

const router = Router();

// POST /api/reports - Generate new report
router.post('/', asyncHandler(generateReport));

// GET /api/reports/:id - Get report
router.get('/:id', asyncHandler(getReport));

// GET /api/reports/:id/download - Download report in various formats
router.get('/:id/download', asyncHandler(downloadReport));

// DELETE /api/reports/:id - Delete report
router.delete('/:id', asyncHandler(deleteReport));

export { router as reportsRoutes };
