import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import { analyticsController } from '../controllers/analytics.controller.js';

const router = Router();

// GET /api/analytics - Get analytics data
router.get('/', asyncHandler(analyticsController.getAnalytics));

export { router as analyticsRoutes };
