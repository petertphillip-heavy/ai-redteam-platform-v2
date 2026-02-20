import { Router } from 'express';
import {
  generateReport,
  getReport,
  deleteReport,
  downloadReport,
} from '../controllers/reports.controller.js';

const router = Router();

// POST /api/reports - Generate new report
router.post('/', generateReport);

// GET /api/reports/:id - Get report
router.get('/:id', getReport);

// GET /api/reports/:id/download - Download report in various formats
router.get('/:id/download', downloadReport);

// DELETE /api/reports/:id - Delete report
router.delete('/:id', deleteReport);

export { router as reportsRoutes };
