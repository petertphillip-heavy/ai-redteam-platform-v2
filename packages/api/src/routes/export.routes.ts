import { Router, Request, Response, NextFunction } from 'express';
import { exportService } from '../services/export.service.js';

const router = Router();

/**
 * GET /api/export/findings
 * Export findings as CSV
 * Optional query param: projectId to filter by project
 */
router.get('/findings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const csv = await exportService.exportFindingsToCSV(projectId);

    const filename = projectId
      ? `findings-project-${projectId}-${new Date().toISOString().split('T')[0]}.csv`
      : `findings-all-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/tests/:id/results
 * Export test results as CSV
 */
router.get('/tests/:id/results', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testRunId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const csv = await exportService.exportTestResultsToCSV(testRunId);

    // Get test run info for filename
    const testInfo = await exportService.getTestRunInfo(testRunId);
    const dateStr = testInfo.startedAt
      ? testInfo.startedAt.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    const projectSlug = testInfo.projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const filename = `test-results-${projectSlug}-${dateStr}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/export/payloads
 * Export all payloads as CSV
 */
router.get('/payloads', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const csv = await exportService.exportPayloadsToCSV();

    const filename = `payloads-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

export { router as exportRoutes };
