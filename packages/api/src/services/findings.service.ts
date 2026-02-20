import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { NotFoundError } from '../middleware/error-handler.js';

type JsonValue = Prisma.InputJsonValue;

export type FindingStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED_RISK' | 'FALSE_POSITIVE';
export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type PayloadCategory = 'PROMPT_INJECTION' | 'DATA_EXTRACTION' | 'GUARDRAIL_BYPASS' | 'INTEGRATION_VULN';

export interface CreateFindingInput {
  projectId: string;
  testResultId?: string;
  title: string;
  description: string;
  severity: Severity;
  category: PayloadCategory;
  evidence?: Record<string, unknown>;
  remediation?: string;
}

export interface UpdateFindingInput {
  title?: string;
  description?: string;
  severity?: Severity;
  category?: PayloadCategory;
  evidence?: Record<string, unknown>;
  remediation?: string;
  status?: FindingStatus;
}

export interface FindingFilters {
  projectId?: string;
  severity?: Severity;
  category?: PayloadCategory;
  status?: FindingStatus;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

class FindingsService {
  async findAll(filters: FindingFilters = {}, pagination: PaginationOptions = {}) {
    const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
    const skip = (page - 1) * limit;

    const where: Prisma.FindingWhereInput = {};

    if (filters.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters.severity) {
      where.severity = filters.severity;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.finding.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          project: {
            select: { id: true, name: true },
          },
          testResult: {
            select: {
              id: true,
              payload: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
      prisma.finding.count({ where }),
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
    const finding = await prisma.finding.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
        testResult: {
          include: {
            payload: true,
          },
        },
      },
    });

    if (!finding) {
      throw new NotFoundError('Finding');
    }

    return finding;
  }

  async findByProject(projectId: string) {
    return prisma.finding.findMany({
      where: { projectId },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
      include: {
        testResult: {
          select: {
            id: true,
            payload: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async create(data: CreateFindingInput) {
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    return prisma.finding.create({
      data: {
        projectId: data.projectId,
        testResultId: data.testResultId,
        title: data.title,
        description: data.description,
        severity: data.severity,
        category: data.category,
        evidence: (data.evidence as JsonValue) ?? Prisma.DbNull,
        remediation: data.remediation,
        status: 'OPEN',
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateFindingInput) {
    await this.findById(id);

    return prisma.finding.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.severity && { severity: data.severity }),
        ...(data.category && { category: data.category }),
        ...(data.evidence !== undefined && { evidence: (data.evidence as JsonValue) ?? Prisma.DbNull }),
        ...(data.remediation !== undefined && { remediation: data.remediation }),
        ...(data.status && { status: data.status }),
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async updateStatus(id: string, status: FindingStatus) {
    await this.findById(id);

    return prisma.finding.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return prisma.finding.delete({
      where: { id },
    });
  }

  async getStats(projectId?: string) {
    const where: Prisma.FindingWhereInput = projectId ? { projectId } : {};

    const [total, bySeverity, byCategory, byStatus] = await Promise.all([
      prisma.finding.count({ where }),
      prisma.finding.groupBy({
        by: ['severity'],
        where,
        _count: { severity: true },
      }),
      prisma.finding.groupBy({
        by: ['category'],
        where,
        _count: { category: true },
      }),
      prisma.finding.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ]);

    return {
      total,
      bySeverity: Object.fromEntries(bySeverity.map(s => [s.severity, s._count.severity])),
      byCategory: Object.fromEntries(byCategory.map(c => [c.category, c._count.category])),
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count.status])),
    };
  }

  async bulkUpdateStatus(ids: string[], status: FindingStatus) {
    const result = await prisma.finding.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    return { updated: result.count };
  }
}

export const findingsService = new FindingsService();
