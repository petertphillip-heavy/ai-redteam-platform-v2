import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { usersService } from '../services/users.service.js';

// Validation schemas
const UserRoleEnum = z.enum(['ADMIN', 'USER', 'VIEWER']);

const querySchema = z.object({
  role: UserRoleEnum.optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional(),
  limit: z.string().regex(/^\d+$/).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
});

const changeRoleSchema = z.object({
  role: UserRoleEnum,
});

// Controller functions
export async function listUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = querySchema.parse(req.query);

    const filters = {
      role: query.role,
      isActive: query.isActive ? query.isActive === 'true' : undefined,
      search: query.search,
    };

    const pagination = {
      page: query.page ? parseInt(query.page, 10) : 1,
      limit: query.limit ? Math.min(parseInt(query.limit, 10), 100) : 50,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    };

    const result = await usersService.findAll(filters, pagination);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const user = await usersService.findById(id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const data = updateUserSchema.parse(req.body);
    const user = await usersService.update(id, data);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const currentUserId = req.user!.userId;

    await usersService.delete(id, currentUserId);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function changeUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { role } = changeRoleSchema.parse(req.body);
    const currentUserId = req.user!.userId;

    const user = await usersService.changeRole(id, role, currentUserId);

    res.json({
      success: true,
      data: user,
      message: `User role changed to ${role}`,
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleUserStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const currentUserId = req.user!.userId;

    const user = await usersService.toggleStatus(id, currentUserId);

    res.json({
      success: true,
      data: user,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await usersService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}
