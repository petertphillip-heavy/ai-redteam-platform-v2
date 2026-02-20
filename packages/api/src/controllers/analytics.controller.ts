import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service.js';

export class AnalyticsController {
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId, startDate, endDate } = req.query;

      const filters = {
        projectId: projectId as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const analytics = await analyticsService.getAnalytics(filters);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
