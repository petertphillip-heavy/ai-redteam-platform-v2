import { prisma } from '../config/database.js';

export interface AnalyticsFilters {
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface TestTrend {
  date: string;
  total: number;
  successful: number;
  failed: number;
}

export interface CategoryEffectiveness {
  category: string;
  total: number;
  successful: number;
  successRate: number;
}

export interface SeverityDistribution {
  severity: string;
  count: number;
}

export interface ProjectComparison {
  projectId: string;
  projectName: string;
  totalTests: number;
  findings: number;
  criticalFindings: number;
}

export interface PayloadEffectiveness {
  payloadId: string;
  payloadName: string;
  timesUsed: number;
  successCount: number;
  successRate: number;
}

export interface AnalyticsData {
  testTrends: TestTrend[];
  categoryEffectiveness: CategoryEffectiveness[];
  severityDistribution: SeverityDistribution[];
  projectComparison: ProjectComparison[];
  payloadEffectiveness: PayloadEffectiveness[];
  summary: {
    totalTests: number;
    totalFindings: number;
    avgSuccessRate: number;
    mostVulnerableCategory: string | null;
  };
}

class AnalyticsService {
  async getAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsData> {
    const { projectId, startDate, endDate } = filters;

    // Base date filter for test runs
    const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = startDate;
      if (endDate) dateFilter.createdAt.lte = endDate;
    }

    // Get test trends (grouped by day)
    const testTrends = await this.getTestTrends(projectId, dateFilter);

    // Get category effectiveness
    const categoryEffectiveness = await this.getCategoryEffectiveness(projectId, dateFilter);

    // Get severity distribution of findings
    const severityDistribution = await this.getSeverityDistribution(projectId);

    // Get project comparison (if no specific project)
    const projectComparison = projectId ? [] : await this.getProjectComparison();

    // Get payload effectiveness
    const payloadEffectiveness = await this.getPayloadEffectiveness(projectId, dateFilter);

    // Get summary stats
    const summary = await this.getSummaryStats(projectId);

    return {
      testTrends,
      categoryEffectiveness,
      severityDistribution,
      projectComparison,
      payloadEffectiveness,
      summary,
    };
  }

  private async getTestTrends(
    projectId?: string,
    dateFilter?: { createdAt?: { gte?: Date; lte?: Date } }
  ): Promise<TestTrend[]> {
    // Get all test results with their dates
    const testResults = await prisma.testResult.findMany({
      where: {
        ...(projectId && { testRun: { projectId } }),
        ...(dateFilter?.createdAt && { createdAt: dateFilter.createdAt }),
      },
      select: {
        createdAt: true,
        success: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const trendMap = new Map<string, { total: number; successful: number; failed: number }>();

    for (const result of testResults) {
      const dateKey = result.createdAt.toISOString().split('T')[0];
      const existing = trendMap.get(dateKey) || { total: 0, successful: 0, failed: 0 };
      existing.total++;
      if (result.success) {
        existing.successful++;
      } else {
        existing.failed++;
      }
      trendMap.set(dateKey, existing);
    }

    return Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  private async getCategoryEffectiveness(
    projectId?: string,
    dateFilter?: { createdAt?: { gte?: Date; lte?: Date } }
  ): Promise<CategoryEffectiveness[]> {
    const results = await prisma.testResult.findMany({
      where: {
        ...(projectId && { testRun: { projectId } }),
        ...(dateFilter?.createdAt && { createdAt: dateFilter.createdAt }),
      },
      select: {
        success: true,
        payload: {
          select: { category: true },
        },
      },
    });

    const categoryMap = new Map<string, { total: number; successful: number }>();

    for (const result of results) {
      const category = result.payload.category;
      const existing = categoryMap.get(category) || { total: 0, successful: 0 };
      existing.total++;
      if (result.success) existing.successful++;
      categoryMap.set(category, existing);
    }

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        total: data.total,
        successful: data.successful,
        successRate: data.total > 0 ? data.successful / data.total : 0,
      }))
      .sort((a, b) => b.successRate - a.successRate);
  }

  private async getSeverityDistribution(projectId?: string): Promise<SeverityDistribution[]> {
    const severities = await prisma.finding.groupBy({
      by: ['severity'],
      where: projectId ? { projectId } : undefined,
      _count: { severity: true },
    });

    const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] as const;
    return severityOrder.map((severity) => {
      const found = severities.find((s: { severity: string; _count: { severity: number } }) => s.severity === severity);
      return {
        severity,
        count: found?._count.severity || 0,
      };
    });
  }

  private async getProjectComparison(): Promise<ProjectComparison[]> {
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            testRuns: true,
            findings: true,
          },
        },
        findings: {
          where: { severity: 'CRITICAL' },
          select: { id: true },
        },
      },
    });

    return projects.map((p: { id: string; name: string; _count: { testRuns: number; findings: number }; findings: { id: string }[] }) => ({
      projectId: p.id,
      projectName: p.name,
      totalTests: p._count.testRuns,
      findings: p._count.findings,
      criticalFindings: p.findings.length,
    }));
  }

  private async getPayloadEffectiveness(
    projectId?: string,
    dateFilter?: { createdAt?: { gte?: Date; lte?: Date } }
  ): Promise<PayloadEffectiveness[]> {
    const results = await prisma.testResult.findMany({
      where: {
        ...(projectId && { testRun: { projectId } }),
        ...(dateFilter?.createdAt && { createdAt: dateFilter.createdAt }),
      },
      select: {
        success: true,
        payload: {
          select: { id: true, name: true },
        },
      },
    });

    const payloadMap = new Map<string, { name: string; timesUsed: number; successCount: number }>();

    for (const result of results) {
      const payloadId = result.payload.id;
      const existing = payloadMap.get(payloadId) || {
        name: result.payload.name,
        timesUsed: 0,
        successCount: 0,
      };
      existing.timesUsed++;
      if (result.success) existing.successCount++;
      payloadMap.set(payloadId, existing);
    }

    return Array.from(payloadMap.entries())
      .map(([payloadId, data]) => ({
        payloadId,
        payloadName: data.name,
        timesUsed: data.timesUsed,
        successCount: data.successCount,
        successRate: data.timesUsed > 0 ? data.successCount / data.timesUsed : 0,
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 20); // Top 20 most effective
  }

  private async getSummaryStats(projectId?: string) {
    const [totalTests, totalFindings, allResults, categoryFindings] = await Promise.all([
      prisma.testRun.count({ where: projectId ? { projectId } : undefined }),
      prisma.finding.count({ where: projectId ? { projectId } : undefined }),
      prisma.testResult.findMany({
        where: projectId ? { testRun: { projectId } } : undefined,
        select: { success: true },
      }),
      prisma.finding.groupBy({
        by: ['category'],
        where: projectId ? { projectId } : undefined,
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 1,
      }),
    ]);

    const successCount = allResults.filter((r: { success: boolean }) => r.success).length;
    const avgSuccessRate = allResults.length > 0 ? successCount / allResults.length : 0;

    return {
      totalTests,
      totalFindings,
      avgSuccessRate,
      mostVulnerableCategory: categoryFindings[0]?.category || null,
    };
  }
}

export const analyticsService = new AnalyticsService();
