/**
 * Export Service
 *
 * Provides CSV export functionality for findings, test results, and payloads.
 */

import { prisma } from '../config/database.js';
import { NotFoundError } from '../middleware/error-handler.js';

/**
 * Escape a value for CSV format
 * Handles values with commas, quotes, and newlines
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let stringValue = String(value);

  // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    stringValue = '"' + stringValue.replace(/"/g, '""') + '"';
  }

  return stringValue;
}

/**
 * Convert an array of objects to CSV format
 */
function toCSV(headers: string[], rows: string[][]): string {
  const headerRow = headers.map(escapeCSV).join(',');
  const dataRows = rows.map(row => row.map(escapeCSV).join(',')).join('\n');
  return headerRow + '\n' + dataRows;
}

class ExportService {
  /**
   * Export findings to CSV format
   */
  async exportFindingsToCSV(projectId?: string): Promise<string> {
    const where = projectId ? { projectId } : {};

    const findings = await prisma.finding.findMany({
      where,
      include: {
        project: {
          select: { name: true },
        },
        testResult: {
          include: {
            payload: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
    });

    const headers = [
      'ID',
      'Title',
      'Description',
      'Severity',
      'Category',
      'Status',
      'Project',
      'Related Payload',
      'Remediation',
      'Created At',
      'Updated At',
    ];

    const rows = findings.map(finding => [
      finding.id,
      finding.title,
      finding.description,
      finding.severity,
      finding.category,
      finding.status,
      finding.project?.name || '',
      finding.testResult?.payload?.name || '',
      finding.remediation || '',
      finding.createdAt.toISOString(),
      finding.updatedAt.toISOString(),
    ]);

    return toCSV(headers, rows);
  }

  /**
   * Export test results to CSV format
   */
  async exportTestResultsToCSV(testRunId: string): Promise<string> {
    // Verify test run exists
    const testRun = await prisma.testRun.findUnique({
      where: { id: testRunId },
      include: {
        project: {
          select: { name: true },
        },
      },
    });

    if (!testRun) {
      throw new NotFoundError('Test run');
    }

    const results = await prisma.testResult.findMany({
      where: { testRunId },
      include: {
        payload: {
          select: {
            id: true,
            name: true,
            category: true,
            severity: true,
            content: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const headers = [
      'Result ID',
      'Payload Name',
      'Category',
      'Severity',
      'Success',
      'Confidence',
      'Duration (ms)',
      'Notes',
      'Payload Content',
      'Created At',
    ];

    const rows = results.map(result => [
      result.id,
      result.payload?.name || '',
      result.payload?.category || '',
      result.payload?.severity || '',
      result.success ? 'Yes' : 'No',
      result.confidence !== null ? (result.confidence * 100).toFixed(1) + '%' : '',
      result.duration !== null ? String(result.duration) : '',
      result.notes || '',
      result.payload?.content || '',
      result.createdAt.toISOString(),
    ]);

    return toCSV(headers, rows);
  }

  /**
   * Export payloads to CSV format
   */
  async exportPayloadsToCSV(): Promise<string> {
    const payloads = await prisma.payload.findMany({
      orderBy: [{ category: 'asc' }, { severity: 'asc' }, { name: 'asc' }],
    });

    const headers = [
      'ID',
      'Name',
      'Description',
      'Category',
      'Subcategory',
      'Severity',
      'Content',
      'Tags',
      'Is Active',
      'Created At',
      'Updated At',
    ];

    const rows = payloads.map(payload => [
      payload.id,
      payload.name,
      payload.description,
      payload.category,
      payload.subcategory || '',
      payload.severity,
      payload.content,
      Array.isArray(payload.tags) ? payload.tags.join('; ') : '',
      payload.isActive ? 'Yes' : 'No',
      payload.createdAt.toISOString(),
      payload.updatedAt.toISOString(),
    ]);

    return toCSV(headers, rows);
  }

  /**
   * Get test run info for filename
   */
  async getTestRunInfo(testRunId: string): Promise<{ projectName: string; startedAt: Date | null }> {
    const testRun = await prisma.testRun.findUnique({
      where: { id: testRunId },
      include: {
        project: {
          select: { name: true },
        },
      },
    });

    if (!testRun) {
      throw new NotFoundError('Test run');
    }

    return {
      projectName: testRun.project?.name || 'unknown',
      startedAt: testRun.startedAt,
    };
  }
}

export const exportService = new ExportService();
