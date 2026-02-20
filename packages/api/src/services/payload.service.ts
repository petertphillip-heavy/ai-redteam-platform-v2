import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { NotFoundError } from '../middleware/error-handler.js';

type JsonValue = Prisma.InputJsonValue;

export type PayloadCategory = 'PROMPT_INJECTION' | 'DATA_EXTRACTION' | 'GUARDRAIL_BYPASS' | 'INTEGRATION_VULN';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface CreatePayloadInput {
  name: string;
  description: string;
  category: PayloadCategory;
  subcategory?: string;
  content: string;
  variables?: Record<string, unknown>;
  severity?: Severity;
  tags?: string[];
  isActive?: boolean;
}

export interface UpdatePayloadInput {
  name?: string;
  description?: string;
  category?: PayloadCategory;
  subcategory?: string | null;
  content?: string;
  variables?: Record<string, unknown> | null;
  severity?: Severity;
  tags?: string[];
  isActive?: boolean;
}

export interface PayloadFilters {
  category?: PayloadCategory;
  subcategory?: string;
  severity?: Severity;
  tags?: string[];
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

class PayloadService {
  async findAll(
    filters: PayloadFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResult<Prisma.PayloadGetPayload<object>>> {
    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.PayloadWhereInput = {};

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.subcategory) {
      where.subcategory = filters.subcategory;
    }

    if (filters.severity) {
      where.severity = filters.severity;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.payload.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.payload.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const payload = await prisma.payload.findUnique({
      where: { id },
    });

    if (!payload) {
      throw new NotFoundError('Payload');
    }

    return payload;
  }

  async findByCategory(category: PayloadCategory) {
    return prisma.payload.findMany({
      where: { category, isActive: true },
      orderBy: { severity: 'asc' },
    });
  }

  async create(data: CreatePayloadInput) {
    return prisma.payload.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        content: data.content,
        variables: (data.variables as JsonValue) ?? Prisma.DbNull,
        severity: data.severity ?? 'MEDIUM',
        tags: data.tags ?? [],
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdatePayloadInput) {
    await this.findById(id); // Ensure exists

    return prisma.payload.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description && { description: data.description }),
        ...(data.category && { category: data.category }),
        ...(data.subcategory !== undefined && { subcategory: data.subcategory }),
        ...(data.content && { content: data.content }),
        ...(data.variables !== undefined && { variables: (data.variables as JsonValue) ?? Prisma.DbNull }),
        ...(data.severity && { severity: data.severity }),
        ...(data.tags && { tags: data.tags }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async delete(id: string) {
    await this.findById(id); // Ensure exists

    return prisma.payload.delete({
      where: { id },
    });
  }

  async bulkCreate(payloads: CreatePayloadInput[]) {
    const results = await prisma.payload.createMany({
      data: payloads.map(p => ({
        name: p.name,
        description: p.description,
        category: p.category,
        subcategory: p.subcategory,
        content: p.content,
        variables: (p.variables as JsonValue) ?? Prisma.DbNull,
        severity: p.severity ?? 'MEDIUM',
        tags: p.tags ?? [],
        isActive: p.isActive ?? true,
      })),
      skipDuplicates: true,
    });

    return { created: results.count };
  }

  async getCategories() {
    const categories = await prisma.payload.groupBy({
      by: ['category'],
      _count: { category: true },
      where: { isActive: true },
    });

    const subcategories = await prisma.payload.groupBy({
      by: ['category', 'subcategory'],
      _count: { subcategory: true },
      where: { isActive: true, subcategory: { not: null } },
    });

    return {
      categories: categories.map(c => ({
        name: c.category,
        count: c._count.category,
      })),
      subcategories: subcategories.map(s => ({
        category: s.category,
        subcategory: s.subcategory,
        count: s._count.subcategory,
      })),
    };
  }

  async getStats() {
    const [total, byCategory, bySeverity] = await Promise.all([
      prisma.payload.count({ where: { isActive: true } }),
      prisma.payload.groupBy({
        by: ['category'],
        _count: { category: true },
        where: { isActive: true },
      }),
      prisma.payload.groupBy({
        by: ['severity'],
        _count: { severity: true },
        where: { isActive: true },
      }),
    ]);

    return {
      total,
      byCategory: Object.fromEntries(byCategory.map(c => [c.category, c._count.category])),
      bySeverity: Object.fromEntries(bySeverity.map(s => [s.severity, s._count.severity])),
    };
  }

  async toggleActive(id: string) {
    const payload = await this.findById(id);

    return prisma.payload.update({
      where: { id },
      data: { isActive: !payload.isActive },
    });
  }
}

export const payloadService = new PayloadService();
