import { Router } from 'express';
import { asyncHandler } from '../middleware/async-handler.js';
import { requireRole } from '../middleware/auth.js';
import {
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  changeUserRole,
  toggleUserStatus,
  getUserStats,
} from '../controllers/users.controller.js';

const router = Router();

// All routes require ADMIN role
router.use(requireRole('ADMIN'));

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List all users
 *     description: Retrieve a paginated list of users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [ADMIN, USER, VIEWER]
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and email
 *     responses:
 *       200:
 *         description: Successful response with paginated users
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - requires admin role
 */
router.get('/', asyncHandler(listUsers));

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieve user statistics (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful response with user statistics
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - requires admin role
 */
router.get('/stats', asyncHandler(getUserStats));

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a single user
 *     description: Retrieve a user by their ID (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: Successful response with the user
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - requires admin role
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/:id', asyncHandler(getUser));

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
 *     description: Update user details (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - requires admin role
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.put('/:id', asyncHandler(updateUser));

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Permanently delete a user (admin only). Cannot delete your own account or the last admin.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - cannot delete own account or last admin
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.delete('/:id', asyncHandler(deleteUser));

/**
 * @swagger
 * /api/users/{id}/role:
 *   patch:
 *     summary: Change user role
 *     description: Change a user's role (admin only). Cannot demote yourself or the last admin.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, USER, VIEWER]
 *     responses:
 *       200:
 *         description: User role changed successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - cannot demote yourself or last admin
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/role', asyncHandler(changeUserRole));

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Toggle user status
 *     description: Activate or deactivate a user (admin only). Cannot deactivate yourself or the last active admin.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User status toggled successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - cannot deactivate yourself or last active admin
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/status', asyncHandler(toggleUserStatus));

export { router as usersRoutes };
