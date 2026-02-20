import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { reportGeneratorService } from '../services/report-generator.service.js';

// Validation schemas
const ReportTypeEnum = z.enum(['EXECUTIVE_SUMMARY', 'TECHNICAL_DETAIL', 'FULL_REPORT']);

const generateReportSchema = z.object({
  projectId: z.string().min(1),
  type: ReportTypeEnum,
  title: z.string().max(255).optional(),
  includeEvidence: z.boolean().optional(),
  testRunIds: z.array(z.string()).optional(),
});

// Controller functions
export async function generateReport(req: Request, res: Response, next: NextFunction) {
  try {
    const data = generateReportSchema.parse(req.body);
    const report = await reportGeneratorService.generate(data);

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

export async function getReport(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const report = await reportGeneratorService.findById(id);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectReports(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = req.params.projectId as string;
    const reports = await reportGeneratorService.findByProject(projectId);

    res.json({
      success: true,
      data: reports,
      count: reports.length,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteReport(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await reportGeneratorService.delete(id);

    res.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function downloadReport(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const format = req.query.format as string || 'json';
    const report = await reportGeneratorService.findById(id);

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${report.title.replace(/[^a-z0-9]/gi, '_')}.json"`);
      res.json(report.content);
    } else if (format === 'markdown' || format === 'md') {
      const markdown = generateMarkdownReport(report);
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${report.title.replace(/[^a-z0-9]/gi, '_')}.md"`);
      res.send(markdown);
    } else if (format === 'html') {
      const html = generateHtmlReport(report);
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${report.title.replace(/[^a-z0-9]/gi, '_')}.html"`);
      res.send(html);
    } else {
      res.status(400).json({
        success: false,
        error: { message: 'Invalid format. Supported: json, markdown, html' },
      });
    }
  } catch (error) {
    next(error);
  }
}

// Helper functions for report generation
function generateMarkdownReport(report: { title: string; content: unknown }): string {
  const content = report.content as {
    summary?: {
      projectName?: string;
      reportDate?: string;
      overallRiskRating?: string;
      totalPayloads?: number;
      successfulAttacks?: number;
      criticalFindings?: number;
      highFindings?: number;
      mediumFindings?: number;
      lowFindings?: number;
    };
    methodology?: string;
    findings?: Array<{
      title: string;
      severity: string;
      category: string;
      description: string;
      evidence?: string;
      remediation?: string;
    }>;
    recommendations?: string[];
    conclusion?: string;
  };

  let md = `# ${report.title}\n\n`;

  // Summary
  if (content.summary) {
    md += `## Executive Summary\n\n`;
    md += `- **Project:** ${content.summary.projectName}\n`;
    md += `- **Report Date:** ${content.summary.reportDate}\n`;
    md += `- **Overall Risk:** ${content.summary.overallRiskRating}\n`;
    md += `- **Total Payloads Tested:** ${content.summary.totalPayloads}\n`;
    md += `- **Successful Attacks:** ${content.summary.successfulAttacks}\n\n`;

    md += `### Findings Summary\n\n`;
    md += `| Severity | Count |\n|----------|-------|\n`;
    md += `| Critical | ${content.summary.criticalFindings} |\n`;
    md += `| High | ${content.summary.highFindings} |\n`;
    md += `| Medium | ${content.summary.mediumFindings} |\n`;
    md += `| Low | ${content.summary.lowFindings} |\n\n`;
  }

  // Methodology
  if (content.methodology) {
    md += content.methodology + '\n\n';
  }

  // Findings
  if (content.findings && content.findings.length > 0) {
    md += `## Detailed Findings\n\n`;

    for (const finding of content.findings) {
      md += `### ${finding.title}\n\n`;
      md += `- **Severity:** ${finding.severity}\n`;
      md += `- **Category:** ${finding.category}\n\n`;
      md += `**Description:**\n${finding.description}\n\n`;

      if (finding.evidence) {
        md += `**Evidence:**\n\`\`\`\n${finding.evidence}\n\`\`\`\n\n`;
      }

      if (finding.remediation) {
        md += `**Remediation:**\n${finding.remediation}\n\n`;
      }

      md += '---\n\n';
    }
  }

  // Recommendations
  if (content.recommendations && content.recommendations.length > 0) {
    md += `## Recommendations\n\n`;
    for (const rec of content.recommendations) {
      md += `- ${rec}\n`;
    }
    md += '\n';
  }

  // Conclusion
  if (content.conclusion) {
    md += `## Conclusion\n\n${content.conclusion}\n`;
  }

  return md;
}

function generateHtmlReport(report: { title: string; content: unknown }): string {
  const content = report.content as {
    summary?: {
      projectName?: string;
      reportDate?: string;
      overallRiskRating?: string;
      overallRiskScore?: number;
      totalPayloads?: number;
      successfulAttacks?: number;
      attackSuccessRate?: number;
      criticalFindings?: number;
      highFindings?: number;
      mediumFindings?: number;
      lowFindings?: number;
    };
    methodology?: string;
    findings?: Array<{
      title: string;
      severity: string;
      category: string;
      description: string;
      evidence?: string;
      remediation?: string;
    }>;
    recommendations?: string[];
    conclusion?: string;
  };

  const severityColors: Record<string, string> = {
    CRITICAL: '#dc2626',
    HIGH: '#ea580c',
    MEDIUM: '#ca8a04',
    LOW: '#16a34a',
    INFO: '#2563eb',
  };

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 2rem; color: #1f2937; }
    h1 { color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; }
    h2 { color: #374151; margin-top: 2rem; }
    h3 { color: #4b5563; }
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1rem 0; }
    .summary-card { background: #f9fafb; border-radius: 8px; padding: 1rem; text-align: center; }
    .summary-card .value { font-size: 2rem; font-weight: bold; }
    .summary-card .label { color: #6b7280; font-size: 0.875rem; }
    .finding { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
    .finding-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .severity-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; color: white; }
    .evidence { background: #f3f4f6; padding: 1rem; border-radius: 4px; font-family: monospace; font-size: 0.875rem; white-space: pre-wrap; overflow-x: auto; }
    .recommendations { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem; margin: 1rem 0; }
    .recommendations ul { margin: 0; padding-left: 1.5rem; }
    .risk-critical { background: #fef2f2; border-color: #dc2626; }
    .risk-high { background: #fff7ed; border-color: #ea580c; }
    .risk-medium { background: #fefce8; border-color: #ca8a04; }
    .risk-low { background: #f0fdf4; border-color: #16a34a; }
  </style>
</head>
<body>
  <h1>${report.title}</h1>`;

  // Summary
  if (content.summary) {
    const riskClass = `risk-${content.summary.overallRiskRating?.toLowerCase()}`;
    html += `
  <h2>Executive Summary</h2>
  <div class="summary-grid">
    <div class="summary-card ${riskClass}">
      <div class="value">${content.summary.overallRiskRating}</div>
      <div class="label">Risk Rating</div>
    </div>
    <div class="summary-card">
      <div class="value">${content.summary.totalPayloads}</div>
      <div class="label">Tests Run</div>
    </div>
    <div class="summary-card">
      <div class="value">${content.summary.successfulAttacks}</div>
      <div class="label">Successful Attacks</div>
    </div>
    <div class="summary-card">
      <div class="value">${Math.round((content.summary.attackSuccessRate || 0) * 100)}%</div>
      <div class="label">Success Rate</div>
    </div>
  </div>
  <div class="summary-grid">
    <div class="summary-card" style="border-left: 4px solid ${severityColors.CRITICAL}">
      <div class="value">${content.summary.criticalFindings}</div>
      <div class="label">Critical</div>
    </div>
    <div class="summary-card" style="border-left: 4px solid ${severityColors.HIGH}">
      <div class="value">${content.summary.highFindings}</div>
      <div class="label">High</div>
    </div>
    <div class="summary-card" style="border-left: 4px solid ${severityColors.MEDIUM}">
      <div class="value">${content.summary.mediumFindings}</div>
      <div class="label">Medium</div>
    </div>
    <div class="summary-card" style="border-left: 4px solid ${severityColors.LOW}">
      <div class="value">${content.summary.lowFindings}</div>
      <div class="label">Low</div>
    </div>
  </div>`;
  }

  // Findings
  if (content.findings && content.findings.length > 0) {
    html += `<h2>Detailed Findings</h2>`;

    for (const finding of content.findings) {
      const color = severityColors[finding.severity] || '#6b7280';
      html += `
  <div class="finding">
    <div class="finding-header">
      <h3 style="margin: 0;">${finding.title}</h3>
      <span class="severity-badge" style="background: ${color}">${finding.severity}</span>
    </div>
    <p><strong>Category:</strong> ${finding.category.replace('_', ' ')}</p>
    <p>${finding.description}</p>`;

      if (finding.evidence) {
        html += `
    <h4>Evidence</h4>
    <div class="evidence">${escapeHtml(finding.evidence)}</div>`;
      }

      if (finding.remediation) {
        html += `
    <h4>Remediation</h4>
    <p>${finding.remediation}</p>`;
      }

      html += `</div>`;
    }
  }

  // Recommendations
  if (content.recommendations && content.recommendations.length > 0) {
    html += `
  <h2>Recommendations</h2>
  <div class="recommendations">
    <ul>
      ${content.recommendations.map(r => `<li>${r}</li>`).join('\n      ')}
    </ul>
  </div>`;
  }

  // Conclusion
  if (content.conclusion) {
    html += `
  <h2>Conclusion</h2>
  <p>${content.conclusion}</p>`;
  }

  html += `
</body>
</html>`;

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
