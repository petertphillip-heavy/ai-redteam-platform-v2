import { Router } from 'express';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  getProjectStats,
} from '../controllers/projects.controller.js';
import { getProjectTestRuns } from '../controllers/tests.controller.js';
import { getProjectFindings } from '../controllers/findings.controller.js';
import { getProjectReports } from '../controllers/reports.controller.js';

const router = Router();

// GET /api/projects - List all projects
router.get('/', listProjects);

// POST /api/projects - Create new project
router.post('/', createProject);

// GET /api/projects/:id - Get single project
router.get('/:id', getProject);

// PUT /api/projects/:id - Update project
router.put('/:id', updateProject);

// DELETE /api/projects/:id - Delete project
router.delete('/:id', deleteProject);

// GET /api/projects/:id/stats - Get project statistics
router.get('/:id/stats', getProjectStats);

// GET /api/projects/:projectId/tests - Get test runs for project
router.get('/:projectId/tests', getProjectTestRuns);

// GET /api/projects/:projectId/findings - Get findings for project
router.get('/:projectId/findings', getProjectFindings);

// GET /api/projects/:projectId/reports - Get reports for project
router.get('/:projectId/reports', getProjectReports);

export { router as projectRoutes };
