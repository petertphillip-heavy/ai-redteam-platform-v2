/**
 * Testing Engine Service
 *
 * Executes attack payloads against target AI systems and records results.
 * Supports API-based testing with configurable rate limiting and retries.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import { detectionService, type PayloadCategory } from './detection.service.js';
import { NotFoundError, AppError } from '../middleware/error-handler.js';

export interface TestConfig {
  projectId: string;
  name?: string;
  categories?: PayloadCategory[];
  payloadIds?: string[];
  rateLimit?: number; // requests per second
  timeout?: number; // ms per request
  retries?: number;
  stopOnFirstSuccess?: boolean;
  dryRun?: boolean; // Don't actually send requests
}

export interface TargetConfig {
  url: string;
  method: 'POST' | 'GET';
  headers: Record<string, string>;
  bodyTemplate: string; // Use {{payload}} as placeholder
  responseField?: string; // JSON path to extract response
  timeout: number;
}

export interface TestProgress {
  testRunId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  totalPayloads: number;
  completedPayloads: number;
  successfulAttacks: number;
  currentPayload?: string;
  errors: string[];
}

// Store for active test runs
const activeTests = new Map<string, { cancel: boolean; progress: TestProgress }>();

class TestingEngineService {
  /**
   * Start a new test run
   */
  async startTest(config: TestConfig): Promise<TestProgress> {
    // Get project
    const project = await prisma.project.findUnique({
      where: { id: config.projectId },
    });

    if (!project) {
      throw new NotFoundError('Project');
    }

    // Get payloads to test
    const payloads = await this.getPayloadsForTest(config);

    if (payloads.length === 0) {
      throw new AppError('No payloads found for the specified criteria', 400);
    }

    // Create test run record
    const testRun = await prisma.testRun.create({
      data: {
        projectId: config.projectId,
        name: config.name || `Test Run ${new Date().toISOString()}`,
        status: 'PENDING',
        categories: config.categories || [],
        totalPayloads: payloads.length,
        completedPayloads: 0,
        successfulAttacks: 0,
        config: {
          rateLimit: config.rateLimit || 1,
          timeout: config.timeout || 30000,
          retries: config.retries || 1,
          stopOnFirstSuccess: config.stopOnFirstSuccess || false,
          dryRun: config.dryRun || false,
        },
      },
    });

    // Initialize progress tracking
    const progress: TestProgress = {
      testRunId: testRun.id,
      status: 'PENDING',
      totalPayloads: payloads.length,
      completedPayloads: 0,
      successfulAttacks: 0,
      errors: [],
    };

    activeTests.set(testRun.id, { cancel: false, progress });

    // Start test execution in background
    this.executeTest(testRun.id, project, payloads, config).catch(err => {
      console.error(`Test run ${testRun.id} failed:`, err);
    });

    return progress;
  }

  /**
   * Get payloads for a test based on config
   */
  private async getPayloadsForTest(config: TestConfig) {
    const where: Prisma.PayloadWhereInput = {
      isActive: true,
    };

    if (config.payloadIds && config.payloadIds.length > 0) {
      where.id = { in: config.payloadIds };
    } else if (config.categories && config.categories.length > 0) {
      where.category = { in: config.categories };
    }

    return prisma.payload.findMany({
      where,
      orderBy: [{ severity: 'asc' }, { category: 'asc' }],
    });
  }

  /**
   * Execute test run
   */
  private async executeTest(
    testRunId: string,
    project: Prisma.ProjectGetPayload<object>,
    payloads: Prisma.PayloadGetPayload<object>[],
    config: TestConfig
  ) {
    const testState = activeTests.get(testRunId);
    if (!testState) return;

    // Update status to running
    await prisma.testRun.update({
      where: { id: testRunId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });
    testState.progress.status = 'RUNNING';

    // Parse target config from project
    const targetConfig = this.parseTargetConfig(project);
    const rateLimit = config.rateLimit || 1;
    const delayMs = 1000 / rateLimit;

    try {
      for (const payload of payloads) {
        // Check for cancellation
        if (testState.cancel) {
          await this.completeTestRun(testRunId, 'CANCELLED');
          return;
        }

        testState.progress.currentPayload = payload.name;

        try {
          // Execute payload against target
          const result = await this.executePayload(
            targetConfig,
            payload,
            config.timeout || 30000,
            config.retries || 1,
            config.dryRun || false
          );

          // Analyze response for success
          const detection = detectionService.analyze(
            result.response,
            payload.category as PayloadCategory,
            payload.content
          );

          // Store result
          await prisma.testResult.create({
            data: {
              testRunId,
              payloadId: payload.id,
              request: result.request as Prisma.InputJsonValue,
              response: {
                body: result.response,
                status: result.status,
                duration: result.duration,
              },
              success: detection.success,
              confidence: detection.confidence,
              duration: result.duration,
              notes: detection.notes,
            },
          });

          // Update progress
          testState.progress.completedPayloads++;
          if (detection.success) {
            testState.progress.successfulAttacks++;

            // Auto-create finding for successful attacks
            if (detection.confidence >= 0.7) {
              await this.createFindingFromResult(
                project.id,
                payload,
                detection,
                result.response
              );
            }
          }

          // Update test run
          await prisma.testRun.update({
            where: { id: testRunId },
            data: {
              completedPayloads: testState.progress.completedPayloads,
              successfulAttacks: testState.progress.successfulAttacks,
            },
          });

          // Stop on first success if configured
          if (config.stopOnFirstSuccess && detection.success) {
            break;
          }

        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error';
          testState.progress.errors.push(`${payload.name}: ${errorMsg}`);

          // Store failed result
          await prisma.testResult.create({
            data: {
              testRunId,
              payloadId: payload.id,
              request: { payload: payload.content } as Prisma.InputJsonValue,
              response: { error: errorMsg },
              success: false,
              confidence: 0,
              notes: `Error: ${errorMsg}`,
            },
          });

          testState.progress.completedPayloads++;
        }

        // Rate limiting delay
        await this.delay(delayMs);
      }

      // Complete test run
      await this.completeTestRun(testRunId, 'COMPLETED');

    } catch (err) {
      console.error(`Test run ${testRunId} error:`, err);
      await this.completeTestRun(testRunId, 'FAILED');
    }
  }

  /**
   * Execute a single payload against the target
   */
  private async executePayload(
    target: TargetConfig,
    payload: Prisma.PayloadGetPayload<object>,
    timeout: number,
    retries: number,
    dryRun: boolean
  ): Promise<{
    request: object;
    response: string;
    status: number;
    duration: number;
  }> {
    // Build request body
    const body = target.bodyTemplate.replace('{{payload}}', payload.content);

    const request = {
      url: target.url,
      method: target.method,
      headers: target.headers,
      body: target.method === 'POST' ? body : undefined,
    };

    // Dry run - return mock response
    if (dryRun) {
      return {
        request,
        response: `[DRY RUN] Would send payload: ${payload.name}`,
        status: 200,
        duration: 0,
      };
    }

    // Execute with retries
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const startTime = Date.now();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(target.url, {
          method: target.method,
          headers: {
            'Content-Type': 'application/json',
            ...target.headers,
          },
          body: target.method === 'POST' ? body : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const duration = Date.now() - startTime;

        // Parse response
        let responseText: string;
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const json = await response.json();
          // Extract specific field if configured
          if (target.responseField) {
            responseText = this.extractJsonField(json, target.responseField);
          } else {
            responseText = JSON.stringify(json);
          }
        } else {
          responseText = await response.text();
        }

        return {
          request,
          response: responseText,
          status: response.status,
          duration,
        };

      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error');
        if (attempt < retries - 1) {
          await this.delay(1000 * (attempt + 1)); // Exponential backoff
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  /**
   * Parse target configuration from project
   */
  private parseTargetConfig(project: Prisma.ProjectGetPayload<object>): TargetConfig {
    const config = project.config as Record<string, unknown> | null;

    return {
      url: project.targetUrl || '',
      method: (config?.method as 'POST' | 'GET') || 'POST',
      headers: {
        ...(config?.headers as Record<string, string> || {}),
        ...(project.apiKey ? { Authorization: `Bearer ${project.apiKey}` } : {}),
      },
      bodyTemplate: (config?.bodyTemplate as string) || '{"message": "{{payload}}"}',
      responseField: config?.responseField as string | undefined,
      timeout: (config?.timeout as number) || 30000,
    };
  }

  /**
   * Extract field from JSON using dot notation
   */
  private extractJsonField(json: unknown, path: string): string {
    const parts = path.split('.');
    let current: unknown = json;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return JSON.stringify(json);
      }
    }

    return typeof current === 'string' ? current : JSON.stringify(current);
  }

  /**
   * Create a finding from a successful attack
   */
  private async createFindingFromResult(
    projectId: string,
    payload: Prisma.PayloadGetPayload<object>,
    detection: { success: boolean; confidence: number; indicators: string[]; notes?: string },
    response: string
  ) {
    await prisma.finding.create({
      data: {
        projectId,
        title: `${payload.category}: ${payload.name}`,
        description: `Attack payload "${payload.name}" succeeded against the target.\n\nPayload:\n${payload.content}\n\nDetection indicators: ${detection.indicators.join(', ')}`,
        severity: payload.severity,
        category: payload.category,
        evidence: {
          payload: payload.content,
          response: response.substring(0, 2000),
          confidence: detection.confidence,
          indicators: detection.indicators,
        },
        remediation: this.getRemediationGuidance(payload.category as PayloadCategory),
        status: 'OPEN',
      },
    });
  }

  /**
   * Get remediation guidance based on category
   */
  private getRemediationGuidance(category: PayloadCategory): string {
    const guidance: Record<PayloadCategory, string> = {
      PROMPT_INJECTION: `1. Implement input validation and sanitization
2. Use clear delimiters between system and user content
3. Apply output filtering for sensitive information
4. Consider using a separate context for system instructions
5. Implement instruction hierarchy with proper privilege levels`,

      DATA_EXTRACTION: `1. Never include sensitive data in system prompts
2. Implement output filtering to prevent credential leakage
3. Use separate contexts for different users
4. Apply redaction rules for sensitive patterns
5. Implement rate limiting on responses`,

      GUARDRAIL_BYPASS: `1. Strengthen content filtering rules
2. Implement multi-layer content moderation
3. Use context-aware filtering that considers conversation history
4. Apply semantic analysis beyond keyword matching
5. Implement behavioral analysis for multi-turn attacks`,

      INTEGRATION_VULN: `1. Validate and sanitize all tool/function inputs
2. Implement least-privilege access for integrations
3. Use parameterized queries for database operations
4. Apply allowlisting for file system access
5. Implement comprehensive logging and monitoring`,
    };

    return guidance[category] || 'Review and strengthen security controls.';
  }

  /**
   * Complete a test run
   */
  private async completeTestRun(
    testRunId: string,
    status: 'COMPLETED' | 'FAILED' | 'CANCELLED'
  ) {
    const testState = activeTests.get(testRunId);
    if (testState) {
      testState.progress.status = status;
    }

    await prisma.testRun.update({
      where: { id: testRunId },
      data: {
        status,
        completedAt: new Date(),
      },
    });

    // Clean up after a delay
    setTimeout(() => {
      activeTests.delete(testRunId);
    }, 60000);
  }

  /**
   * Cancel a running test
   */
  async cancelTest(testRunId: string): Promise<void> {
    const testState = activeTests.get(testRunId);
    if (testState) {
      testState.cancel = true;
    } else {
      // Try to cancel in database if not in memory
      await prisma.testRun.updateMany({
        where: { id: testRunId, status: { in: ['PENDING', 'RUNNING'] } },
        data: { status: 'CANCELLED', completedAt: new Date() },
      });
    }
  }

  /**
   * Get test run progress
   */
  getProgress(testRunId: string): TestProgress | null {
    return activeTests.get(testRunId)?.progress || null;
  }

  /**
   * Get test progress for SSE streaming
   * Returns current progress from memory or falls back to database
   */
  async getProgressForSSE(testRunId: string): Promise<{
    completedPayloads: number;
    totalPayloads: number;
    successfulAttacks: number;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    currentPayload?: string;
    errors?: string[];
    isComplete: boolean;
  } | null> {
    // Try to get live progress from memory first
    const liveProgress = this.getProgress(testRunId);

    if (liveProgress) {
      return {
        completedPayloads: liveProgress.completedPayloads,
        totalPayloads: liveProgress.totalPayloads,
        successfulAttacks: liveProgress.successfulAttacks,
        status: liveProgress.status,
        currentPayload: liveProgress.currentPayload,
        errors: liveProgress.errors,
        isComplete: ['COMPLETED', 'FAILED', 'CANCELLED'].includes(liveProgress.status),
      };
    }

    // Fall back to database
    const testRun = await prisma.testRun.findUnique({
      where: { id: testRunId },
      select: {
        status: true,
        completedPayloads: true,
        totalPayloads: true,
        successfulAttacks: true,
      },
    });

    if (!testRun) {
      return null;
    }

    return {
      completedPayloads: testRun.completedPayloads,
      totalPayloads: testRun.totalPayloads,
      successfulAttacks: testRun.successfulAttacks,
      status: testRun.status as 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED',
      isComplete: ['COMPLETED', 'FAILED', 'CANCELLED'].includes(testRun.status),
    };
  }

  /**
   * Get test run by ID with results
   */
  async getTestRun(testRunId: string) {
    const testRun = await prisma.testRun.findUnique({
      where: { id: testRunId },
      include: {
        project: {
          select: { id: true, name: true },
        },
        results: {
          include: {
            payload: {
              select: { id: true, name: true, category: true, severity: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!testRun) {
      throw new NotFoundError('Test run');
    }

    // Merge with live progress if available
    const liveProgress = this.getProgress(testRunId);

    return {
      ...testRun,
      liveProgress,
    };
  }

  /**
   * Get test runs for a project
   */
  async getProjectTestRuns(projectId: string, limit = 20) {
    return prisma.testRun.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { results: true },
        },
      },
    });
  }

  /**
   * Get all test runs with pagination
   */
  async getAllTests(params: {
    page?: number;
    limit?: number;
    projectId?: string;
    status?: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  } = {}) {
    const { page = 1, limit = 20, projectId, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.TestRunWhereInput = {};
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.testRun.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          project: {
            select: { id: true, name: true },
          },
          _count: {
            select: { results: true },
          },
        },
      }),
      prisma.testRun.count({ where }),
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

  /**
   * Get test results for a test run
   */
  async getTestResults(testRunId: string) {
    return prisma.testResult.findMany({
      where: { testRunId },
      include: {
        payload: {
          select: { id: true, name: true, category: true, severity: true, content: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Utility: delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const testingEngineService = new TestingEngineService();
