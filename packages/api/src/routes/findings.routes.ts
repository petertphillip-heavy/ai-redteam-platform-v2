import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
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
router.get('/', asyncHandler(listFindings));

// GET /api/findings/stats - Get findings statistics
router.get('/stats', asyncHandler(getFindingsStats));

// POST /api/findings/bulk-status - Bulk update status
router.post('/bulk-status', asyncHandler(bulkUpdateStatus));

// GET /api/findings/:id - Get single finding
router.get('/:id', asyncHandler(getFinding));

// POST /api/findings - Create new finding
router.post('/', asyncHandler(createFinding));

// PUT /api/findings/:id - Update finding
router.put('/:id', asyncHandler(updateFinding));

// PATCH /api/findings/:id/status - Update finding status
router.patch('/:id/status', asyncHandler(updateFindingStatus));

// DELETE /api/findings/:id - Delete finding
router.delete('/:id', asyncHandler(deleteFinding));

export { router as findingsRoutes };
