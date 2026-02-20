import { Request, Response } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, getCurrentUser, updatePassword } from '../services/auth.service.js';
import { auditService, extractIpAddress, extractUserAgent } from '../services/audit.service.js';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function register(req: Request, res: Response): Promise<void> {
  const input = registerSchema.parse(req.body);
  const result = await registerUser(input);

  // Log registration action
  await auditService.logAction({
    userId: result.user.id,
    action: 'REGISTER',
    entity: 'User',
    entityId: result.user.id,
    metadata: { email: result.user.email },
    ipAddress: extractIpAddress(req),
    userAgent: extractUserAgent(req),
  });

  res.status(201).json({
    success: true,
    data: result,
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = loginSchema.parse(req.body);
  const result = await loginUser(input);

  // Log login action
  await auditService.logAction({
    userId: result.user.id,
    action: 'LOGIN',
    entity: 'User',
    entityId: result.user.id,
    metadata: { email: result.user.email },
    ipAddress: extractIpAddress(req),
    userAgent: extractUserAgent(req),
  });

  res.json({
    success: true,
    data: result,
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  // JWT is stateless, so logout is handled client-side by removing the token
  // This endpoint exists for API completeness and future token blacklisting

  // Log logout action
  await auditService.logAction({
    userId: req.user?.userId,
    action: 'LOGOUT',
    entity: 'User',
    entityId: req.user?.userId,
    ipAddress: extractIpAddress(req),
    userAgent: extractUserAgent(req),
  });

  res.json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const user = await getCurrentUser(userId);

  res.json({
    success: true,
    data: user,
  });
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const input = updatePasswordSchema.parse(req.body);

  await updatePassword(userId, input.currentPassword, input.newPassword);

  // Log password change action
  await auditService.logAction({
    userId,
    action: 'PASSWORD_CHANGE',
    entity: 'User',
    entityId: userId,
    ipAddress: extractIpAddress(req),
    userAgent: extractUserAgent(req),
  });

  res.json({
    success: true,
    data: { message: 'Password updated successfully' },
  });
}
