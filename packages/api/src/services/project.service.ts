import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { NotFoundError } from '../middleware/error-handler.js';

type JsonValue = Prisma.InputJsonValue;

export type TargetType = 'API' | 'CHATBOT' | 'COPILOT' | 'AGENT' | 'CUSTOM';

export interface CreateProjectInput {
  name: string;
  description?: string;
  targetUrl?: string;
  targetType?: TargetType;
  apiKey?: string;
  config?: {
    headers?: Record<string, string>;
    method?: 'POST' | 'GET';
    bodyTemplate?: string;
    responseField?: string;
    timeout?: number;
    rateLimit?: number;
  };
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  targetUrl?: string | null;
  targetType?: TargetType;
  apiKey?: string | null;
  config?: Record<string, unknown> | null;
}

export interface ProjectFilters {
  search?: string;
  targetType?: TargetType;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class ProjectService {
  async findAll(filters: ProjectFilters = {}, pagination: PaginationOptions = {}) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.ProjectWhereInput = {};

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.targetType) {
      where.targetType = filters.targetType;
    }

    const [data, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              testRuns: true,
              findings: true,
            },
          },
        },
      }),
      prisma.project.count({ where }),
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
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            testRuns: true,
            findings: true,
            reports: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    return project;
  }

  async create(data: CreateProjectInput) {
    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        targetUrl: data.targetUrl,
        targetType: data.targetType ?? 'API',
        apiKey: data.apiKey,
        config: (data.config as JsonValue) ?? Prisma.DbNull,
      },
    });
  }

  async update(id: string, data: UpdateProjectInput) {
    await this.findById(id);

    return prisma.project.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.targetUrl !== undefined && { targetUrl: data.targetUrl }),
        ...(data.targetType && { targetType: data.targetType }),
        ...(data.apiKey !== undefined && { apiKey: data.apiKey }),
        ...(data.config !== undefined && { config: (data.config as JsonValue) ?? Prisma.DbNull }),
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return prisma.project.delete({
      where: { id },
    });
  }

  async getProjectStats(id: string) {
    const project = await this.findById(id);

    const [testRuns, findings, successRate] = await Promise.all([
      prisma.testRun.findMany({
        where: { projectId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          totalPayloads: true,
          successfulAttacks: true,
          createdAt: true,
          completedAt: true,
        },
      }),
      prisma.finding.groupBy({
        by: ['severity'],
        where: { projectId: id },
        _count: { severity: true },
      }),
      prisma.testResult.aggregate({
        where: { testRun: { projectId: id } },
        _avg: { confidence: true },
        _count: { _all: true, success: true },
      }),
    ]);

    return {
      project,
      recentTestRuns: testRuns,
      findingsBySeverity: Object.fromEntries(
        findings.map(f => [f.severity, f._count.severity])
      ),
      overallStats: {
        totalTests: successRate._count._all,
        successfulAttacks: successRate._count.success,
        avgConfidence: successRate._avg.confidence,
      },
    };
  }
}

export const projectService = new ProjectService();
