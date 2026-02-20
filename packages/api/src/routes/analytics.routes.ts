import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';

const router = Router();

// GET /api/analytics - Get analytics data
router.get('/', analyticsController.getAnalytics);

export { router as analyticsRoutes };
