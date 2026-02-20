import { Router } from 'express';
import {
  listFindings,
  getFinding,
  createFinding,
  updateFinding,
  updateFindingStatus,
  deleteFinding,
  getFindingsStats,
  bulkUpdateStatus,
} from '../controllers/findings.controller.js';

const router = Router();

// GET /api/findings - List all findings (paginated, filterable)
router.get('/', listFindings);

// GET /api/findings/stats - Get findings statistics
router.get('/stats', getFindingsStats);

// POST /api/findings/bulk-status - Bulk update status
router.post('/bulk-status', bulkUpdateStatus);

// GET /api/findings/:id - Get single finding
router.get('/:id', getFinding);

// POST /api/findings - Create new finding
router.post('/', createFinding);

// PUT /api/findings/:id - Update finding
router.put('/:id', updateFinding);

// PATCH /api/findings/:id/status - Update finding status
router.patch('/:id/status', updateFindingStatus);

// DELETE /api/findings/:id - Delete finding
router.delete('/:id', deleteFinding);

export { router as findingsRoutes };
