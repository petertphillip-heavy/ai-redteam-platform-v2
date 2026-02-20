import { Router } from 'express';
import { register, login, logout, me, changePassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register - Register new user
router.post('/register', register);

// POST /api/auth/login - Login user
router.post('/login', login);

// POST /api/auth/logout - Logout user (requires auth)
router.post('/logout', authenticate, logout);

// GET /api/auth/me - Get current user
router.get('/me', authenticate, me);

// POST /api/auth/change-password - Change password
router.post('/change-password', authenticate, changePassword);

export { router as authRoutes };
