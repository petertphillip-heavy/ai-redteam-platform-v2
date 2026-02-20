import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../middleware/error-handler.js';

export type UserRole = 'ADMIN' | 'USER' | 'VIEWER';

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  isActive?: boolean;
}

// Type for user without password
type UserWithoutPassword = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

class UsersService {
  private excludePassword(user: Prisma.UserGetPayload<object>): UserWithoutPassword {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserWithoutPassword;
  }

  async findAll(
    filters: UserFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<UserWithoutPassword>> {
    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users.map(user => this.excludePassword(user)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<UserWithoutPassword> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    return this.excludePassword(user);
  }

  async update(id: string, data: UpdateUserInput): Promise<UserWithoutPassword> {
    await this.findById(id); // Ensure exists

    // Check email uniqueness if updating email
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ValidationError('Email already in use');
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return this.excludePassword(user);
  }

  async delete(id: string, currentUserId: string): Promise<void> {
    const user = await this.findById(id);

    // Prevent deleting own account
    if (id === currentUserId) {
      throw new ForbiddenError('Cannot delete your own account');
    }

    // Check if this is the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (adminCount <= 1) {
        throw new ForbiddenError('Cannot delete the last admin user');
      }
    }

    await prisma.user.delete({
      where: { id },
    });
  }

  async changeRole(id: string, role: UserRole, currentUserId: string): Promise<UserWithoutPassword> {
    const user = await this.findById(id);

    // Prevent demoting yourself
    if (id === currentUserId && role !== 'ADMIN') {
      throw new ForbiddenError('Cannot demote your own account');
    }

    // Prevent demoting the last admin
    if (user.role === 'ADMIN' && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (adminCount <= 1) {
        throw new ForbiddenError('Cannot demote the last admin user');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
    });

    return this.excludePassword(updatedUser);
  }

  async toggleStatus(id: string, currentUserId: string): Promise<UserWithoutPassword> {
    const user = await this.findById(id);

    // Prevent deactivating own account
    if (id === currentUserId) {
      throw new ForbiddenError('Cannot deactivate your own account');
    }

    // Prevent deactivating the last active admin
    if (user.role === 'ADMIN' && user.isActive) {
      const activeAdminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });
      if (activeAdminCount <= 1) {
        throw new ForbiddenError('Cannot deactivate the last active admin user');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });

    return this.excludePassword(updatedUser);
  }

  async getStats() {
    const [total, byRole, byStatus] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      prisma.user.groupBy({
        by: ['isActive'],
        _count: { isActive: true },
      }),
    ]);

    return {
      total,
      byRole: Object.fromEntries(byRole.map(r => [r.role, r._count.role])),
      active: byStatus.find(s => s.isActive)?._count.isActive ?? 0,
      inactive: byStatus.find(s => !s.isActive)?._count.isActive ?? 0,
    };
  }
}

export const usersService = new UsersService();
