/**
 * SSE (Server-Sent Events) Routes
 *
 * Provides real-time streaming updates for test progress.
 */

import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { testingEngineService } from '../services/testing-engine.service.js';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import type { JwtPayload } from '../middleware/auth.js';

const router = Router();

/**
 * SSE-specific authentication middleware
 * Supports both Authorization header and query parameter token
 * (EventSource API doesn't support custom headers)
 */
function authenticateSSE(req: Request, res: Response, next: NextFunction): void {
  // Try Authorization header first
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token) {
    // Fall back to query parameter for EventSource
    token = req.query.token as string;
  }

  if (!token) {
    res.status(401).json({
      success: false,
      error: { message: 'Missing authorization token' },
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired token' },
    });
  }
}

/**
 * GET /api/tests/:id/stream
 * SSE endpoint for real-time test progress updates
 */
router.get('/:id/stream', authenticateSSE, async (req: Request, res: Response) => {
  const id = req.params.id as string;

  // Verify test exists
  const testRun = await prisma.testRun.findUnique({
    where: { id },
    select: { id: true, status: true },
  });

  if (!testRun) {
    res.status(404).json({
      success: false,
      error: { message: 'Test run not found' },
    });
    return;
  }

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Send initial connection event
  res.write('event: connected\n');
  res.write(`data: ${JSON.stringify({ testId: id, timestamp: new Date().toISOString() })}\n\n`);

  // If test is already completed, send final status and close
  if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(testRun.status)) {
    const finalData = await getFinalTestData(id);
    res.write('event: complete\n');
    res.write(`data: ${JSON.stringify(finalData)}\n\n`);
    res.end();
    return;
  }

  // Track if client is still connected
  let isClientConnected = true;

  // Handle client disconnect
  req.on('close', () => {
    isClientConnected = false;
  });

  // Send progress updates every 2 seconds
  const intervalId = setInterval(async () => {
    if (!isClientConnected) {
      clearInterval(intervalId);
      return;
    }

    try {
      // Get live progress from the testing engine
      const liveProgress = testingEngineService.getProgress(id);

      if (liveProgress) {
        // Test is still running - send progress update
        if (liveProgress.status === 'RUNNING' || liveProgress.status === 'PENDING') {
          res.write('event: progress\n');
          res.write(`data: ${JSON.stringify({
            completedPayloads: liveProgress.completedPayloads,
            totalPayloads: liveProgress.totalPayloads,
            successfulAttacks: liveProgress.successfulAttacks,
            status: liveProgress.status,
            currentPayload: liveProgress.currentPayload,
          })}\n\n`);
        } else {
          // Test completed/failed/cancelled
          clearInterval(intervalId);
          res.write('event: complete\n');
          res.write(`data: ${JSON.stringify({
            status: liveProgress.status,
            successfulAttacks: liveProgress.successfulAttacks,
            completedPayloads: liveProgress.completedPayloads,
            totalPayloads: liveProgress.totalPayloads,
            errors: liveProgress.errors,
          })}\n\n`);
          res.end();
        }
      } else {
        // No live progress - check database for final status
        const currentTest = await prisma.testRun.findUnique({
          where: { id },
          select: {
            status: true,
            completedPayloads: true,
            totalPayloads: true,
            successfulAttacks: true,
          },
        });

        if (currentTest) {
          if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(currentTest.status)) {
            clearInterval(intervalId);
            res.write('event: complete\n');
            res.write(`data: ${JSON.stringify({
              status: currentTest.status,
              successfulAttacks: currentTest.successfulAttacks,
              completedPayloads: currentTest.completedPayloads,
              totalPayloads: currentTest.totalPayloads,
            })}\n\n`);
            res.end();
          } else {
            // Still pending/running but no live progress yet
            res.write('event: progress\n');
            res.write(`data: ${JSON.stringify({
              completedPayloads: currentTest.completedPayloads,
              totalPayloads: currentTest.totalPayloads,
              successfulAttacks: currentTest.successfulAttacks,
              status: currentTest.status,
            })}\n\n`);
          }
        }
      }
    } catch (error) {
      console.error('SSE progress error:', error);
      // Send error event but keep connection open
      res.write('event: error\n');
      res.write(`data: ${JSON.stringify({ message: 'Error fetching progress' })}\n\n`);
    }
  }, 2000);

  // Clean up on connection close
  req.on('close', () => {
    clearInterval(intervalId);
  });
});

/**
 * Helper function to get final test data from database
 */
async function getFinalTestData(testId: string) {
  const testRun = await prisma.testRun.findUnique({
    where: { id: testId },
    select: {
      status: true,
      completedPayloads: true,
      totalPayloads: true,
      successfulAttacks: true,
      completedAt: true,
    },
  });

  return {
    status: testRun?.status || 'UNKNOWN',
    successfulAttacks: testRun?.successfulAttacks || 0,
    completedPayloads: testRun?.completedPayloads || 0,
    totalPayloads: testRun?.totalPayloads || 0,
    completedAt: testRun?.completedAt?.toISOString(),
  };
}

export { router as sseRoutes };
