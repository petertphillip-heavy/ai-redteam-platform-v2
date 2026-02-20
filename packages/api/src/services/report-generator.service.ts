import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { NotFoundError, AppError } from '../middleware/error-handler.js';

export type ReportType = 'EXECUTIVE_SUMMARY' | 'TECHNICAL_DETAIL' | 'FULL_REPORT';

export interface GenerateReportInput {
  projectId: string;
  type: ReportType;
  title?: string;
  includeEvidence?: boolean;
  testRunIds?: string[];
}

export interface ReportContent {
  summary: {
    projectName: string;
    reportDate: string;
    testPeriod: {
      start: string;
      end: string;
    };
    totalTests: number;
    totalPayloads: number;
    successfulAttacks: number;
    attackSuccessRate: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
    overallRiskRating: string;
    overallRiskScore: number;
  };
  methodology?: string;
  findings: Array<{
    id: string;
    title: string;
    severity: string;
    category: string;
    description: string;
    evidence?: string;
    remediation?: string;
    status: string;
  }>;
  categoryBreakdown: Record<string, {
    total: number;
    successful: number;
    findings: number;
  }>;
  recommendations: string[];
  conclusion: string;
}

class ReportGeneratorService {
  async generate(input: GenerateReportInput) {
    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    // Get test runs
    const testRunWhere: Prisma.TestRunWhereInput = {
      projectId: input.projectId,
      status: 'COMPLETED',
    };

    if (input.testRunIds && input.testRunIds.length > 0) {
      testRunWhere.id = { in: input.testRunIds };
    }

    const testRuns = await prisma.testRun.findMany({
      where: testRunWhere,
      include: {
        results: {
          include: {
            payload: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (testRuns.length === 0) {
      throw new AppError('No completed test runs found for this project', 400);
    }

    // Get findings
    const findings = await prisma.finding.findMany({
      where: { projectId: input.projectId },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
    });

    // Generate report content based on type
    const content = this.generateContent(
      project,
      testRuns,
      findings,
      input.type,
      input.includeEvidence ?? true
    );

    // Save report
    const report = await prisma.report.create({
      data: {
        projectId: input.projectId,
        title: input.title || this.generateTitle(project.name, input.type),
        type: input.type,
        content: content as unknown as Prisma.InputJsonValue,
      },
    });

    return report;
  }

  private generateContent(
    project: Prisma.ProjectGetPayload<object>,
    testRuns: Array<Prisma.TestRunGetPayload<{ include: { results: { include: { payload: true } } } }>>,
    findings: Prisma.FindingGetPayload<object>[],
    type: ReportType,
    includeEvidence: boolean
  ): ReportContent {
    // Calculate statistics
    const totalTests = testRuns.length;
    const totalPayloads = testRuns.reduce((sum, tr) => sum + tr.totalPayloads, 0);
    const successfulAttacks = testRuns.reduce((sum, tr) => sum + tr.successfulAttacks, 0);
    const attackSuccessRate = totalPayloads > 0 ? successfulAttacks / totalPayloads : 0;

    // Count findings by severity
    const criticalFindings = findings.filter(f => f.severity === 'CRITICAL').length;
    const highFindings = findings.filter(f => f.severity === 'HIGH').length;
    const mediumFindings = findings.filter(f => f.severity === 'MEDIUM').length;
    const lowFindings = findings.filter(f => f.severity === 'LOW').length;

    // Calculate risk score and rating
    const { riskScore, riskRating } = this.calculateRisk(
      criticalFindings,
      highFindings,
      mediumFindings,
      lowFindings,
      attackSuccessRate
    );

    // Get test period
    const testDates = testRuns
      .flatMap(tr => [tr.startedAt, tr.completedAt])
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    const testPeriod = {
      start: testDates[0]?.toISOString() || new Date().toISOString(),
      end: testDates[testDates.length - 1]?.toISOString() || new Date().toISOString(),
    };

    // Category breakdown
    const categoryBreakdown = this.calculateCategoryBreakdown(testRuns, findings);

    // Format findings for report
    const reportFindings = findings.map(f => ({
      id: f.id,
      title: f.title,
      severity: f.severity,
      category: f.category,
      description: f.description,
      evidence: includeEvidence ? this.formatEvidence(f.evidence) : undefined,
      remediation: f.remediation || this.getDefaultRemediation(f.category),
      status: f.status,
    }));

    // Generate recommendations
    const recommendations = this.generateRecommendations(findings, categoryBreakdown);

    // Base content
    const content: ReportContent = {
      summary: {
        projectName: project.name,
        reportDate: new Date().toISOString(),
        testPeriod,
        totalTests,
        totalPayloads,
        successfulAttacks,
        attackSuccessRate,
        criticalFindings,
        highFindings,
        mediumFindings,
        lowFindings,
        overallRiskRating: riskRating,
        overallRiskScore: riskScore,
      },
      findings: reportFindings,
      categoryBreakdown,
      recommendations,
      conclusion: this.generateConclusion(riskRating, findings.length, successfulAttacks),
    };

    // Add methodology for full reports
    if (type === 'FULL_REPORT' || type === 'TECHNICAL_DETAIL') {
      content.methodology = this.getMethodology();
    }

    return content;
  }

  private calculateRisk(
    critical: number,
    high: number,
    medium: number,
    low: number,
    successRate: number
  ): { riskScore: number; riskRating: string } {
    // Weighted score calculation
    const score = (critical * 40) + (high * 20) + (medium * 10) + (low * 5) + (successRate * 100);

    let rating: string;
    if (score >= 100 || critical > 0) {
      rating = 'CRITICAL';
    } else if (score >= 50 || high > 2) {
      rating = 'HIGH';
    } else if (score >= 20 || medium > 3) {
      rating = 'MEDIUM';
    } else if (score > 0) {
      rating = 'LOW';
    } else {
      rating = 'MINIMAL';
    }

    return { riskScore: Math.min(score, 100), riskRating: rating };
  }

  private calculateCategoryBreakdown(
    testRuns: Array<Prisma.TestRunGetPayload<{ include: { results: { include: { payload: true } } } }>>,
    findings: Prisma.FindingGetPayload<object>[]
  ): Record<string, { total: number; successful: number; findings: number }> {
    const breakdown: Record<string, { total: number; successful: number; findings: number }> = {
      PROMPT_INJECTION: { total: 0, successful: 0, findings: 0 },
      DATA_EXTRACTION: { total: 0, successful: 0, findings: 0 },
      GUARDRAIL_BYPASS: { total: 0, successful: 0, findings: 0 },
      INTEGRATION_VULN: { total: 0, successful: 0, findings: 0 },
    };

    // Count from test results
    for (const testRun of testRuns) {
      for (const result of testRun.results) {
        const category = result.payload.category;
        if (breakdown[category]) {
          breakdown[category].total++;
          if (result.success) {
            breakdown[category].successful++;
          }
        }
      }
    }

    // Count findings
    for (const finding of findings) {
      if (breakdown[finding.category]) {
        breakdown[finding.category].findings++;
      }
    }

    return breakdown;
  }

  private formatEvidence(evidence: Prisma.JsonValue): string | undefined {
    if (!evidence || evidence === null) return undefined;

    try {
      const e = evidence as Record<string, unknown>;
      let formatted = '';

      if (e.payload) {
        formatted += `Payload:\n${e.payload}\n\n`;
      }

      if (e.response) {
        const response = String(e.response).substring(0, 500);
        formatted += `Response (truncated):\n${response}\n`;
      }

      if (e.indicators && Array.isArray(e.indicators)) {
        formatted += `\nDetection Indicators:\n- ${e.indicators.join('\n- ')}`;
      }

      return formatted || undefined;
    } catch {
      return undefined;
    }
  }

  private getDefaultRemediation(category: string): string {
    const remediations: Record<string, string> = {
      PROMPT_INJECTION: 'Implement input validation, use clear delimiters between system and user content, and apply instruction hierarchy with proper privilege levels.',
      DATA_EXTRACTION: 'Never include sensitive data in system prompts, implement output filtering, and use separate contexts for different users.',
      GUARDRAIL_BYPASS: 'Strengthen content filtering, implement multi-layer moderation, and apply behavioral analysis for multi-turn attacks.',
      INTEGRATION_VULN: 'Validate all tool inputs, implement least-privilege access, use parameterized queries, and implement comprehensive logging.',
    };

    return remediations[category] || 'Review and strengthen security controls.';
  }

  private generateRecommendations(
    findings: Prisma.FindingGetPayload<object>[],
    breakdown: Record<string, { total: number; successful: number; findings: number }>
  ): string[] {
    const recommendations: string[] = [];

    // Based on findings
    const criticalCount = findings.filter(f => f.severity === 'CRITICAL').length;
    const highCount = findings.filter(f => f.severity === 'HIGH').length;

    if (criticalCount > 0) {
      recommendations.push('URGENT: Address all critical findings immediately before production deployment.');
    }

    if (highCount > 0) {
      recommendations.push('Prioritize remediation of high-severity findings within the next sprint cycle.');
    }

    // Based on category breakdown
    const categories = Object.entries(breakdown);
    for (const [category, stats] of categories) {
      const successRate = stats.total > 0 ? stats.successful / stats.total : 0;

      if (successRate > 0.3) {
        const categoryName = category.replace('_', ' ').toLowerCase();
        recommendations.push(`Implement additional controls for ${categoryName} attacks (${Math.round(successRate * 100)}% success rate).`);
      }
    }

    // General recommendations
    if (breakdown.PROMPT_INJECTION.successful > 0) {
      recommendations.push('Review and strengthen system prompt isolation to prevent instruction override attacks.');
    }

    if (breakdown.DATA_EXTRACTION.successful > 0) {
      recommendations.push('Implement output filtering to prevent sensitive data leakage.');
    }

    if (breakdown.GUARDRAIL_BYPASS.successful > 0) {
      recommendations.push('Enhance content moderation with multi-layer filtering and behavioral analysis.');
    }

    if (breakdown.INTEGRATION_VULN.successful > 0) {
      recommendations.push('Review tool/function call security and implement strict input validation.');
    }

    // Always include
    recommendations.push('Conduct regular security assessments as the AI system evolves.');
    recommendations.push('Implement monitoring and alerting for suspicious AI behavior in production.');

    return recommendations;
  }

  private generateConclusion(riskRating: string, findingCount: number, successfulAttacks: number): string {
    if (riskRating === 'CRITICAL' || riskRating === 'HIGH') {
      return `This assessment identified ${findingCount} security findings with ${successfulAttacks} successful attack vectors. The overall risk rating is ${riskRating}, indicating significant security concerns that require immediate attention. It is strongly recommended to address the critical and high-severity findings before deploying this AI system to production or exposing it to untrusted users.`;
    }

    if (riskRating === 'MEDIUM') {
      return `This assessment identified ${findingCount} security findings. The overall risk rating is ${riskRating}, indicating moderate security concerns. While no critical vulnerabilities were found, the identified issues should be addressed to improve the system's security posture before broader deployment.`;
    }

    if (findingCount === 0) {
      return `This assessment did not identify any security findings. The AI system demonstrated resilience against the tested attack vectors. However, security is an ongoing concern, and regular assessments are recommended as the system evolves.`;
    }

    return `This assessment identified ${findingCount} security findings with a ${riskRating} overall risk rating. The system shows reasonable resilience to common attacks, but continued monitoring and periodic reassessment are recommended.`;
  }

  private getMethodology(): string {
    return `## Testing Methodology

This security assessment followed a structured approach based on the OWASP LLM Top 10 and industry best practices for AI red teaming.

### Testing Phases

1. **Reconnaissance & Scoping**
   - Target system analysis
   - Threat modeling
   - Attack surface identification

2. **Attack Execution**
   - Prompt Injection: Direct and indirect injection attempts
   - Data Extraction: System prompt disclosure, context leakage
   - Guardrail Bypass: Content filter evasion, role-play attacks
   - Integration Testing: Tool abuse, API security probes

3. **Success Detection**
   - Pattern-based analysis
   - Confidence scoring
   - Manual verification of high-confidence findings

4. **Reporting & Remediation**
   - Finding documentation
   - Risk assessment
   - Remediation guidance

### Attack Categories

- **Prompt Injection**: Attempts to override system instructions through user input
- **Data Extraction**: Attempts to extract sensitive information from the AI system
- **Guardrail Bypass**: Attempts to circumvent content filtering and safety measures
- **Integration Vulnerabilities**: Tests for weaknesses in tool/function integrations`;
  }

  private generateTitle(projectName: string, type: ReportType): string {
    const date = new Date().toISOString().split('T')[0];
    const typeLabels: Record<ReportType, string> = {
      EXECUTIVE_SUMMARY: 'Executive Summary',
      TECHNICAL_DETAIL: 'Technical Assessment',
      FULL_REPORT: 'Full Security Report',
    };

    return `${projectName} - AI Security ${typeLabels[type]} - ${date}`;
  }

  async findById(id: string) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    if (!report) {
      throw new NotFoundError('Report');
    }

    return report;
  }

  async findByProject(projectId: string) {
    return prisma.report.findMany({
      where: { projectId },
      orderBy: { generatedAt: 'desc' },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return prisma.report.delete({
      where: { id },
    });
  }
}

export const reportGeneratorService = new ReportGeneratorService();
