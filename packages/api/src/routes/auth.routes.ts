import { Router } from 'express';
import { register, login, logout, me, changePassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';

const router = Router();

// POST /api/auth/register - Register new user
router.post('/register', asyncHandler(register));

// POST /api/auth/login - Login user
router.post('/login', asyncHandler(login));

// POST /api/auth/logout - Logout user (requires auth)
router.post('/logout', authenticate, asyncHandler(logout));

// GET /api/auth/me - Get current user
router.get('/me', authenticate, asyncHandler(me));

// POST /api/auth/change-password - Change password
router.post('/change-password', authenticate, asyncHandler(changePassword));

export { router as authRoutes };
